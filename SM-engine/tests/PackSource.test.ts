import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import yazl from 'yazl';
import { PackSource } from '../src/main/content/PackSource';
import { EntryNotFoundError, PasswordRequiredError } from '../src/main/content/GameSource';
import { createEncryptionMetadata } from '../src/main/content/password';
import { CONTENT_PATHS } from './helpers/contentSource';

const ENCRYPTION_BIT = 0x1;

let tempDir: string;

function buildZip(targetPath: string, entries: Record<string, string | Buffer>): Promise<void> {
  return new Promise((resolve, reject) => {
    const zip = new yazl.ZipFile();
    for (const [name, content] of Object.entries(entries)) {
      zip.addBuffer(Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8'), name);
    }
    const output = fs.createWriteStream(targetPath);
    output.on('close', () => resolve());
    output.on('error', reject);
    zip.outputStream.pipe(output).on('error', reject);
    zip.end();
  });
}

/**
 * Sets the general purpose bit flag on one entry in both its local file header
 * and its central directory record, which is where a reader looks to decide
 * whether an entry is encrypted. This simulates the flag without needing an
 * external tool to produce a real ZipCrypto archive.
 */
/**
 * Sets the general purpose bit flag on one entry in both its local file header
 * and its central directory record, which is where a reader looks to decide
 * whether an entry is encrypted. This simulates the flag without needing an
 * external tool to produce a real ZipCrypto archive.
 */
function setEncryptionBit(zipPath: string, entryName: string): void {
  const buf = fs.readFileSync(zipPath);
  const target = Buffer.from(entryName, 'utf8');
  let patched = 0;

  // Local file headers, walked sequentially from the start of the archive.
  // 30 bytes of fixed header precede the name; the two length fields that
  // precede the name are not the signature.
  const LOCAL_SIG = 0x04034b50;
  let pos = 0;
  while (pos + 30 <= buf.length && buf.readUInt32LE(pos) === LOCAL_SIG) {
    const compressedSize = buf.readUInt32LE(pos + 18);
    const nameLength = buf.readUInt16LE(pos + 26);
    const extraLength = buf.readUInt16LE(pos + 28);
    if (buf.slice(pos + 30, pos + 30 + nameLength).equals(target)) {
      buf.writeUInt16LE(buf.readUInt16LE(pos + 6) | ENCRYPTION_BIT, pos + 6);
      patched++;
    }
    pos += 30 + nameLength + extraLength + compressedSize;
  }

  // Central directory, walked from the offset recorded in the EOCD.
  const EOCD_SIG = 0x06054b50;
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) {
    throw new Error('end of central directory record not found');
  }

  const entryCount = buf.readUInt16LE(eocd + 10);
  pos = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < entryCount; i++) {
    if (buf.readUInt32LE(pos) !== 0x02014b50) {
      throw new Error(`bad central directory header at ${pos}`);
    }
    const nameLength = buf.readUInt16LE(pos + 28);
    const extraLength = buf.readUInt16LE(pos + 30);
    const commentLength = buf.readUInt16LE(pos + 32);
    if (buf.slice(pos + 46, pos + 46 + nameLength).equals(target)) {
      buf.writeUInt16LE(buf.readUInt16LE(pos + 8) | ENCRYPTION_BIT, pos + 8);
      patched++;
    }
    pos += 46 + nameLength + extraLength + commentLength;
  }

  if (patched === 0) {
    throw new Error(`no local or central header found for entry: ${entryName}`);
  }

  fs.writeFileSync(zipPath, buf);
}

const MINIMAL_ENTRIES: Record<string, string> = {
  'Metadata.json': JSON.stringify({
    Title: 'Test Game',
    TitleScreenImageName: 'title',
    StartFile: 'Start',
    ScenarioExtension: 'txt',
    PictureFormatType: 2,
    PackFormatVersion: 1,
  }),
  'Scripts/Scenarios/Start.txt': 'BEGIN SCENARIO Start\nWRITE TEXT Kenji Hello\nEND SCENARIO',
  'Assets/Scenes/room.png': 'fake-png-bytes',
};

beforeAll(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sm-fap-test-'));
});

afterAll(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('PackSource - reading a plaintext pack', () => {
  let source: PackSource;
  const packPath = () => path.join(tempDir, 'plain.fap');

  beforeAll(async () => {
    await buildZip(packPath(), MINIMAL_ENTRIES);
    source = new PackSource(packPath());
    await source.open();
  });

  afterAll(async () => {
    await source.close();
  });

  it('indexes the canonical layout', () => {
    expect(source.kind).toBe('pack');
    expect(source.exists('Metadata.json')).toBe(true);
    expect(source.exists('Scripts/Scenarios/Start.txt')).toBe(true);
    expect(source.exists('Assets/Scenes/room.png')).toBe(true);
  });

  it('reports a missing entry as absent rather than throwing', () => {
    expect(source.exists('Assets/Scenes/nope.png')).toBe(false);
  });

  it('reads text entries', async () => {
    const text = await source.readText('Scripts/Scenarios/Start.txt');
    expect(text).toContain('WRITE TEXT Kenji Hello');
  });

  it('reads binary entries', async () => {
    const buffer = await source.readBuffer('Assets/Scenes/room.png');
    expect(buffer.toString('utf8')).toBe('fake-png-bytes');
  });

  it('streams entries', async () => {
    const chunks: Buffer[] = [];
    for await (const chunk of await source.readStream('Assets/Scenes/room.png')) {
      chunks.push(chunk as Buffer);
    }
    expect(Buffer.concat(chunks).toString('utf8')).toBe('fake-png-bytes');
  });

  it('reports uncompressed sizes', () => {
    expect(source.size('Assets/Scenes/room.png')).toBe(Buffer.byteLength('fake-png-bytes'));
    expect(source.size('Assets/Scenes/nope.png')).toBeNull();
  });

  it('reads metadata and validates the format version', async () => {
    const metadata = await source.readMetadata();
    expect(metadata.Title).toBe('Test Game');
    expect(metadata.PackFormatVersion).toBe(1);
  });

  it('throws EntryNotFoundError for a missing entry', async () => {
    await expect(source.readText('Assets/Scenes/nope.png')).rejects.toBeInstanceOf(EntryNotFoundError);
  });

  it('does not require a password', () => {
    expect(source.requiresPassword).toBe(false);
  });
});

describe('PackSource - validation', () => {
  it('refuses a pack with no Metadata.json', async () => {
    const p = path.join(tempDir, 'nometadata.fap');
    await buildZip(p, { 'Assets/Scenes/room.png': 'x' });
    const bad = new PackSource(p);
    await expect(bad.open()).rejects.toThrow(/missing Metadata\.json/i);
  });

  it('refuses a pack whose major format version is newer than supported', async () => {
    const p = path.join(tempDir, 'future.fap');
    await buildZip(p, {
      ...MINIMAL_ENTRIES,
      'Metadata.json': JSON.stringify({ Title: 'x', PackFormatVersion: 99 }),
    });
    const future = new PackSource(p);
    await expect(future.open()).rejects.toThrow(/newer than the supported version/i);
  });

  it('accepts a pack with no PackFormatVersion at all', async () => {
    const p = path.join(tempDir, 'noversion.fap');
    await buildZip(p, {
      ...MINIMAL_ENTRIES,
      'Metadata.json': JSON.stringify({ Title: 'x' }),
    });
    const ok = new PackSource(p);
    await expect(ok.open()).resolves.toBeUndefined();
    await ok.close();
  });

  it('refuses to open when Metadata.json itself is encrypted', async () => {
    const p = path.join(tempDir, 'encmetadata.fap');
    await buildZip(p, MINIMAL_ENTRIES);
    setEncryptionBit(p, 'Metadata.json');

    const src = new PackSource(p);
    // The engine must read Metadata.json before it can ask for a password, so
    // an encrypted one is unsatisfiable rather than merely awkward.
    await expect(src.open()).rejects.toThrow(/must not be encrypted/i);
  });

  it('refuses to open a file that is not a zip', async () => {
    const p = path.join(tempDir, 'notazip.fap');
    fs.writeFileSync(p, 'this is not a zip file');
    const bad = new PackSource(p);
    await expect(bad.open()).rejects.toThrow();
  });

  it('refuses reads before open', async () => {
    const unopened = new PackSource(path.join(tempDir, 'plain.fap'));
    await expect(unopened.readText('Metadata.json')).rejects.toThrow(/not open/i);
  });
});

describe('PackSource - encrypted pack', () => {
  const password = 'correct horse';
  let packPath: string;

  beforeAll(async () => {
    packPath = path.join(tempDir, 'encrypted.fap');
    await buildZip(packPath, {
      ...MINIMAL_ENTRIES,
      'Metadata.json': JSON.stringify({
        Title: 'Encrypted Game',
        StartFile: 'Start',
        ScenarioExtension: 'txt',
        PackFormatVersion: 1,
        Encryption: createEncryptionMetadata(password),
      }),
    });
    // Metadata.json stays unencrypted; only content entries carry the bit.
    setEncryptionBit(packPath, 'Assets/Scenes/room.png');
  });

  it('detects that a password is required without being given one', async () => {
    const src = new PackSource(packPath);
    await src.open();
    expect(src.requiresPassword).toBe(true);
    expect(src.exists('Assets/Scenes/room.png')).toBe(true);
    await src.close();
  });

  it('reads unencrypted entries before any password is supplied', async () => {
    const src = new PackSource(packPath);
    await src.open();
    const metadata = await src.readMetadata();
    expect(metadata.Title).toBe('Encrypted Game');
    expect(metadata.Encryption).toBeDefined();
    await src.close();
  });

  it('refuses an encrypted entry with PasswordRequiredError, not a broken stream', async () => {
    const src = new PackSource(packPath);
    await src.open();
    // Failing before the response starts is what lets the protocol handler
    // return a real status code rather than a stream that dies mid-body.
    await expect(src.readStream('Assets/Scenes/room.png')).rejects.toBeInstanceOf(PasswordRequiredError);
    await src.close();
  });

  it('accepts the correct password', async () => {
    const src = new PackSource(packPath);
    await src.open();
    expect(await src.verifyPassword(password)).toBe(true);
    expect(await src.verifyPassword('wrong password')).toBe(false);
    await src.close();
  });

  it('accepts any password when the pack declares no Encryption block', async () => {
    const plain = new PackSource(path.join(tempDir, 'plain.fap'));
    await plain.open();
    expect(await plain.verifyPassword('irrelevant')).toBe(true);
    await plain.close();
  });

  it('automatically unlocks when Metadata.json contains the Password', async () => {
    const autoPackPath = path.join(tempDir, 'auto-encrypted.fap');
    await buildZip(autoPackPath, {
      ...MINIMAL_ENTRIES,
      'Metadata.json': JSON.stringify({
        Title: 'Auto Encrypted Game',
        StartFile: 'Start',
        ScenarioExtension: 'txt',
        PackFormatVersion: 1,
        Password: password,
        Encryption: createEncryptionMetadata(password),
      }),
    });
    setEncryptionBit(autoPackPath, 'Assets/Scenes/room.png');

    const src = new PackSource(autoPackPath);
    await src.open();
    expect(src.requiresPassword).toBe(true);
    expect(src.isUnlocked).toBe(true);
    await src.close();
  });
});
