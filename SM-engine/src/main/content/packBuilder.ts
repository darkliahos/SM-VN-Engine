import * as fsp from 'fs/promises';
import * as path from 'path';
import yazl from 'yazl';
import { ContentTree, readContentTree } from './contentTree';

/**
 * Writes a content tree out as a `.fap`.
 *
 * Entries are stored rather than deflated. The content is almost entirely PNG,
 * JPEG and MP3, which are already compressed, so deflating them costs real time
 * on every rebuild and buys almost nothing.
 *
 * Shared by the launch-time auto-build and the `npm run fap` tool so the two
 * cannot drift. Free of any `electron` import.
 */

/** Schema version of the sidecar manifest, not of the pack format. */
export const MANIFEST_VERSION = 1;

/**
 * Fixed entry timestamp so building the same content twice produces identical
 * bytes. Without this the zip embeds "now" and every rebuild looks like a change.
 */
const DETERMINISTIC_MTIME = new Date(Date.UTC(2000, 0, 1));

export interface PackManifest {
  manifestVersion: number;
  /** Digest of the content this pack was built from. */
  contentDigest: string;
  entryCount: number;
  entries: { path: string; size: number }[];
  /** Size of the pack file itself, so a truncated or missing pack is detected. */
  packBytes: number;
  /** Informational only. Never used to decide freshness. */
  builtAt: string;
}

export interface PackWriteResult {
  packPath: string;
  manifestPath: string;
  entryCount: number;
  contentDigest: string;
  bytes: number;
}

export interface EnsurePackResult extends PackWriteResult {
  /** True when an existing pack was still current and nothing was written. */
  reused: boolean;
  warnings: string[];
}

/** Sidecar manifest path for a pack. Kept outside the pack so the layout stays canonical. */
export function manifestPathFor(packPath: string): string {
  return `${packPath}.manifest.json`;
}

export function buildManifest(
  tree: ContentTree,
  packBytes: number,
  now: Date = new Date()
): PackManifest {
  return {
    manifestVersion: MANIFEST_VERSION,
    contentDigest: tree.digest,
    entryCount: tree.entries.length,
    entries: tree.entries.map(entry => ({ path: entry.path, size: entry.data.length })),
    packBytes,
    builtAt: now.toISOString(),
  };
}

/** Builds the zip in memory. */
export function buildPackBuffer(tree: ContentTree): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const zip = new yazl.ZipFile();
    const chunks: Buffer[] = [];

    zip.outputStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    zip.outputStream.on('error', reject);
    zip.outputStream.on('end', () => resolve(Buffer.concat(chunks)));

    for (const entry of tree.entries) {
      zip.addBuffer(entry.data, entry.path, { compress: false, mtime: DETERMINISTIC_MTIME });
    }
    zip.end();
  });
}

/** Reads the sidecar manifest, or null when it is missing or unusable. */
export async function readManifest(packPath: string): Promise<PackManifest | null> {
  try {
    const raw = await fsp.readFile(manifestPathFor(packPath), 'utf8');
    const parsed = JSON.parse(raw) as PackManifest;
    if (
      typeof parsed?.contentDigest !== 'string' ||
      parsed.manifestVersion !== MANIFEST_VERSION ||
      typeof parsed.packBytes !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    // A missing or corrupt manifest means "cannot prove freshness", which the
    // caller must treat as stale rather than as fresh.
    return null;
  }
}

export function isPackFresh(manifest: PackManifest | null, contentDigest: string): boolean {
  return manifest !== null && manifest.contentDigest === contentDigest;
}

/**
 * Writes via a temporary file and renames into place, so a reader never sees a
 * half-written pack and two engines starting at once cannot produce one.
 */
async function writeAtomic(targetPath: string, write: (handle: fsp.FileHandle) => Promise<void>): Promise<void> {
  await fsp.mkdir(path.dirname(targetPath), { recursive: true });
  const tempPath = `${targetPath}.${process.pid}.${Date.now().toString(36)}.tmp`;
  let handle: fsp.FileHandle | undefined;
  try {
    handle = await fsp.open(tempPath, 'w');
    await write(handle);
    await handle.close();
    handle = undefined;
    await fsp.rename(tempPath, targetPath);
  } catch (err) {
    if (handle) {
      await handle.close().catch(() => undefined);
    }
    await fsp.rm(tempPath, { force: true }).catch(() => undefined);
    throw err;
  }
}

/**
 * A pack may only be reused when its manifest matches the content *and* the pack
 * file is present and the right size. Checking the digest alone is not enough:
 * the manifest lives in a separate file, so deleting or truncating the pack
 * leaves a perfectly matching manifest behind.
 */
export async function packIsUsable(
  packPath: string,
  manifest: PackManifest | null,
  contentDigest: string
): Promise<boolean> {
  if (!isPackFresh(manifest, contentDigest)) {
    return false;
  }
  const { size } = await statOrZero(packPath);
  return size > 0 && size === manifest!.packBytes;
}

export async function writePack(
  tree: ContentTree,
  packPath: string,
  now: Date = new Date()
): Promise<PackWriteResult> {
  const resolvedPackPath = path.resolve(packPath);
  const buffer = await buildPackBuffer(tree);
  const manifest = buildManifest(tree, buffer.length, now);

  await writeAtomic(resolvedPackPath, handle => handle.writeFile(buffer));
  // Pack first, then manifest. If this second write fails the pack is treated as
  // stale next time, which is the safe direction to fail in.
  await writeAtomic(manifestPathFor(resolvedPackPath), handle =>
    handle.writeFile(JSON.stringify(manifest, null, 2), 'utf8')
  );

  return {
    packPath: resolvedPackPath,
    manifestPath: manifestPathFor(resolvedPackPath),
    entryCount: manifest.entryCount,
    contentDigest: manifest.contentDigest,
    bytes: buffer.length,
  };
}

/**
 * Builds the pack only when the cached one is missing or out of date. This is the
 * single entry point used both at launch and by the `fap` tool.
 */
export async function ensurePack(
  sourceRoot: string,
  packPath: string,
  options: { force?: boolean; now?: Date } = {}
): Promise<EnsurePackResult> {
  const tree = await readContentTree(sourceRoot);
  const resolvedPackPath = path.resolve(packPath);

  if (!options.force) {
    const manifest = await readManifest(resolvedPackPath);
    if (await packIsUsable(resolvedPackPath, manifest, tree.digest)) {
      const { size } = await statOrZero(resolvedPackPath);
      return {
        packPath: resolvedPackPath,
        manifestPath: manifestPathFor(resolvedPackPath),
        entryCount: manifest!.entryCount,
        contentDigest: manifest!.contentDigest,
        bytes: size,
        reused: true,
        warnings: tree.warnings,
      };
    }
  }

  const written = await writePack(tree, resolvedPackPath, options.now);
  return { ...written, reused: false, warnings: tree.warnings };
}

async function statOrZero(target: string): Promise<{ size: number }> {
  try {
    return { size: (await fsp.stat(target)).size };
  } catch {
    return { size: 0 };
  }
}