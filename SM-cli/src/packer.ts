import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import yazl from 'yazl';
import { encodeKeyFile } from './cipher';

const DEFAULT_KDF_ITERATIONS = 100_000;
const VERIFIER_BYTES = 32;
const DETERMINISTIC_MTIME = new Date(Date.UTC(2000, 0, 1));

export interface PackOptions {
  /** Absolute path to the project directory (contains Metadata.json, Assets/, Scripts/). */
  projectDir: string;
  /** Absolute path for the output .fap file. Defaults to <projectDir>/game.fap. */
  outPath?: string;
  /** If set, ZipCrypto-encrypts entries and writes a matching .key file. */
  password?: string;
  /** PBKDF2 iteration count (default 100 000). */
  iterations?: number;
}

export interface PackResult {
  packPath: string;
  keyPath: string | null;
  entryCount: number;
  bytes: number;
  contentDigest: string;
  warnings: string[];
}

interface EncryptionMetadata {
  Algorithm: string;
  Kdf: string;
  Iterations: number;
  Salt: string;
  Verifier: string;
}

function createEncryptionBlock(password: string, iterations: number): EncryptionMetadata {
  const salt = crypto.randomBytes(16);
  const verifier = crypto.pbkdf2Sync(password, salt, iterations, VERIFIER_BYTES, 'sha256');
  return {
    Algorithm: 'ZipCrypto',
    Kdf: 'pbkdf2-sha256',
    Iterations: iterations,
    Salt: salt.toString('base64'),
    Verifier: verifier.toString('base64'),
  };
}

/**
 * Recursively collects all file paths under a directory.
 * Returns paths relative to the base directory.
 */
function collectFiles(dir: string, base: string = dir): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...collectFiles(full, base));
    } else if (entry.isFile()) {
      // Use forward slashes for zip entry paths (platform-independent)
      result.push(path.relative(base, full).replace(/\\/g, '/'));
    }
  }
  return result;
}

/**
 * Builds the pack buffer from the project directory.
 * When a password is supplied the Metadata.json embedded in the pack is patched
 * with the PBKDF2 Encryption block *before* zipping — no plaintext password is
 * ever written.
 */
async function buildPackBuffer(
  projectDir: string,
  encryptionBlock: EncryptionMetadata | null,
  password?: string
): Promise<{ buffer: Buffer; entryPaths: string[]; contentDigest: string; warnings: string[] }> {
  const warnings: string[] = [];

  // Read and (optionally) patch Metadata.json
  const metaPath = path.join(projectDir, 'Metadata.json');
  let metaRaw = fs.readFileSync(metaPath, 'utf8');
  let metadata = JSON.parse(metaRaw) as Record<string, unknown>;

  if (encryptionBlock) {
    // Inject PBKDF2 verifier block; strip any plaintext Password field
    delete metadata['Password'];
    metadata['Encryption'] = encryptionBlock;
    metaRaw = JSON.stringify(metadata, null, 2);
  }

  // Collect all content files relative to project root
  const relPaths: string[] = [];
  for (const top of ['Assets', 'Scripts']) {
    const dir = path.join(projectDir, top);
    if (fs.existsSync(dir)) {
      const sub = collectFiles(dir, projectDir);
      relPaths.push(...sub);
    } else {
      warnings.push(`Directory not found (skipped): ${top}/`);
    }
  }

  if (relPaths.length === 0) {
    warnings.push('No content files found — pack will contain only Metadata.json');
  }

  // Build content digest over (Metadata + sorted file contents)
  const hasher = crypto.createHash('sha256');
  hasher.update(metaRaw);
  for (const rel of [...relPaths].sort()) {
    hasher.update(rel);
    hasher.update(fs.readFileSync(path.join(projectDir, rel)));
  }
  const contentDigest = hasher.digest('hex');

  // Stream into yazl zip
  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const zip = new yazl.ZipFile();
    const chunks: Buffer[] = [];

    zip.outputStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    zip.outputStream.on('error', reject);
    zip.outputStream.on('end', () => resolve(Buffer.concat(chunks)));

    // Metadata.json is always unencrypted (engine reads it before unlocking)
    const metaBuf = Buffer.from(metaRaw, 'utf8');
    zip.addBuffer(metaBuf, 'Metadata.json', {
      compress: false,
      mtime: DETERMINISTIC_MTIME,
    });

    for (const rel of relPaths) {
      const data = fs.readFileSync(path.join(projectDir, rel));
      const opts: Partial<yazl.Options> = { compress: false, mtime: DETERMINISTIC_MTIME };
      if (password) {
        // ZipCrypto password on each entry (yazl supports this via the password option)
        (opts as Partial<yazl.Options> & { password?: string }).password = password;
      }
      zip.addBuffer(data, rel, opts);
    }

    zip.end();
  });

  return { buffer, entryPaths: ['Metadata.json', ...relPaths], contentDigest, warnings };
}

/**
 * Writes a buffer atomically via a temp file + rename.
 */
async function writeAtomic(targetPath: string, buffer: Buffer): Promise<void> {
  const { promises: fsp } = await import('fs');
  await fsp.mkdir(path.dirname(targetPath), { recursive: true });
  const tmp = `${targetPath}.${process.pid}.${Date.now().toString(36)}.tmp`;
  try {
    await fsp.writeFile(tmp, buffer);
    await fsp.rename(tmp, targetPath);
  } catch (err) {
    await fsp.rm(tmp, { force: true }).catch(() => undefined);
    throw err;
  }
}

/**
 * Main entry point: builds the .fap pack (and optionally the .key file).
 */
export async function buildPack(options: PackOptions): Promise<PackResult> {
  const { projectDir, password, iterations = DEFAULT_KDF_ITERATIONS } = options;

  const outPath = options.outPath ?? path.join(projectDir, 'game.fap');
  const keyPath = password
    ? outPath.replace(/\.fap$/i, '.key')
    : null;

  const encryptionBlock = password
    ? createEncryptionBlock(password, iterations)
    : null;

  const { buffer, entryPaths, contentDigest, warnings } = await buildPackBuffer(
    projectDir,
    encryptionBlock,
    password
  );

  await writeAtomic(outPath, buffer);

  if (password && keyPath) {
    const keyPayload = encodeKeyFile(password);
    await writeAtomic(keyPath, keyPayload);
  }

  return {
    packPath: outPath,
    keyPath,
    entryCount: entryPaths.length,
    bytes: buffer.length,
    contentDigest,
    warnings,
  };
}
