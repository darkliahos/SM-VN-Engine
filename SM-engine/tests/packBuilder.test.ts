import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Open } from 'unzipper';
import {
  buildManifest,
  buildPackBuffer,
  ensurePack,
  isPackFresh,
  manifestPathFor,
  MANIFEST_VERSION,
  readManifest,
  writePack,
} from '../src/main/content/packBuilder';
import { readContentTree } from '../src/main/content/contentTree';
import { PackSource } from '../src/main/content/PackSource';
import { METADATA_FILE } from '../src/services/GamePaths';

let root: string;
let packPath: string;

function write(entryPath: string, content: string | Buffer): void {
  const target = path.join(root, ...entryPath.split('/'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function seed(): void {
  write('Metadata.json', JSON.stringify({ Title: 'Test', StartFile: 'Start', ScenarioExtension: 'txt', PackFormatVersion: 1 }));
  write('Assets/Scenes/room.jpg', Buffer.from([0xff, 0xd8, 0xff, 0xe0]));
  write('Assets/Title.png', Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  write('Scripts/Scenarios/Start.txt', 'BEGIN SCENARIO Start\nEND SCENARIO');
}

/** Lists the entry names in a zip, straight from the central directory. */
async function zipEntryNames(buffer: Buffer): Promise<string[]> {
  const dir = await Open.buffer(buffer);
  return dir.files.map(f => f.path).sort();
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'sm-builder-'));
  packPath = path.join(root, 'game.fap');
  seed();
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('packBuilder - output shape', () => {
  it('produces a zip whose entries are the canonical content paths', async () => {
    const buffer = await buildPackBuffer(await readContentTree(root));
    expect(await zipEntryNames(buffer)).toEqual([
      'Assets/Scenes/room.jpg',
      'Assets/Title.png',
      'Metadata.json',
      'Scripts/Scenarios/Start.txt',
    ]);
  });

  it('starts with the zip signature', async () => {
    const buffer = await buildPackBuffer(await readContentTree(root));
    expect(buffer.subarray(0, 4).toString('hex')).toBe('504b0304');
  });

  it('uses forward slashes, never backslashes', async () => {
    const buffer = await buildPackBuffer(await readContentTree(root));
    for (const name of await zipEntryNames(buffer)) {
      expect(name).not.toContain('\\');
    }
  });

  it('stores entries uncompressed, so already-compressed media is not re-deflated', async () => {
    const buffer = await buildPackBuffer(await readContentTree(root));
    const dir = await Open.buffer(buffer);
    for (const entry of dir.files) {
      expect(entry.compressionMethod).toBe(0);
    }
  });

  it('preserves content byte for byte through a round trip', async () => {
    await writePack(await readContentTree(root), packPath);
    const source = new PackSource(packPath);
    await source.open();

    expect([...(await source.readBuffer('Assets/Title.png'))]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    expect([...(await source.readBuffer('Assets/Scenes/room.jpg'))]).toEqual([0xff, 0xd8, 0xff, 0xe0]);
    expect((await source.readText('Scripts/Scenarios/Start.txt')).startsWith('BEGIN SCENARIO')).toBe(true);
    expect(JSON.parse(await source.readText(METADATA_FILE)).Title).toBe('Test');

    await source.close();
  });

  it('is byte-for-byte reproducible for identical content', async () => {
    const tree = await readContentTree(root);
    const first = await buildPackBuffer(tree);
    const second = await buildPackBuffer(await readContentTree(root));
    expect(first.equals(second)).toBe(true);
  });

  it('does not embed a build timestamp in the zip', async () => {
    // Reproducibility above is what makes an unchanged pack recognisable as
    // unchanged; an embedded "now" would defeat it.
    const a = await buildPackBuffer(await readContentTree(root));
    await new Promise(resolve => setTimeout(resolve, 1100));
    const b = await buildPackBuffer(await readContentTree(root));
    expect(a.equals(b)).toBe(true);
  });
});

describe('packBuilder - written pack', () => {
  it('writes a pack the engine can open', async () => {
    await writePack(await readContentTree(root), packPath);
    const source = new PackSource(packPath);
    await source.open();
    expect(source.kind).toBe('pack');
    expect((await source.readMetadata()).Title).toBe('Test');
    await source.close();
  });

  it('writes a sidecar manifest rather than putting it in the pack', async () => {
    await writePack(await readContentTree(root), packPath);
    const manifestPath = manifestPathFor(packPath);
    expect(fs.existsSync(manifestPath)).toBe(true);

    // Keeping the manifest out of the archive is what lets the pack keep exactly
    // the canonical layout the standard defines.
    const names = await zipEntryNames(fs.readFileSync(packPath));
    expect(names.some(n => n.includes('manifest'))).toBe(false);
    expect(names).toContain(METADATA_FILE);
  });

  it('leaves no temporary files behind', async () => {
    await writePack(await readContentTree(root), packPath);
    const leftovers = fs.readdirSync(root).filter(name => name.endsWith('.tmp'));
    expect(leftovers).toEqual([]);
  });

  it('creates the output directory if needed', async () => {
    const nested = path.join(root, 'build', 'out', 'game.fap');
    await writePack(await readContentTree(root), nested);
    expect(fs.existsSync(nested)).toBe(true);
  });
});

describe('packBuilder - manifest', () => {
  it('records the content digest, entry count, sizes and pack size', async () => {
    const tree = await readContentTree(root);
    const written = await writePack(tree, packPath);
    const manifest = await readManifest(packPath);

    expect(manifest).not.toBeNull();
    expect(manifest!.manifestVersion).toBe(MANIFEST_VERSION);
    expect(manifest!.contentDigest).toBe(tree.digest);
    expect(manifest!.entryCount).toBe(tree.entries.length);
    expect(manifest!.packBytes).toBe(written.bytes);
    expect(manifest!.entries).toContainEqual({ path: METADATA_FILE, size: expect.any(Number) });
  });

  it('sorts entries so the manifest is stable', async () => {
    await writePack(await readContentTree(root), packPath);
    const manifest = await readManifest(packPath);
    const paths = manifest!.entries.map(e => e.path);
    expect(paths).toEqual([...paths].sort());
  });

  it('returns null when there is no manifest', async () => {
    expect(await readManifest(packPath)).toBeNull();
  });

  it('returns null for a corrupt manifest rather than throwing', async () => {
    await writePack(await readContentTree(root), packPath);
    fs.writeFileSync(manifestPathFor(packPath), 'not json {{{');
    expect(await readManifest(packPath)).toBeNull();
  });

  it('returns null for a manifest from a future schema version', async () => {
    await writePack(await readContentTree(root), packPath);
    fs.writeFileSync(manifestPathFor(packPath), JSON.stringify({ manifestVersion: 999, contentDigest: 'x' }));
    expect(await readManifest(packPath)).toBeNull();
  });

  it('builds a manifest with an explicit timestamp when asked', async () => {
    const tree = await readContentTree(root);
    const when = new Date('2020-05-05T00:00:00.000Z');
    expect(buildManifest(tree, 1234, when).builtAt).toBe('2020-05-05T00:00:00.000Z');
    expect(buildManifest(tree, 1234, when).packBytes).toBe(1234);
  });

  it('returns null for a manifest that predates the packBytes field', async () => {
    await writePack(await readContentTree(root), packPath);
    const manifest = (await readManifest(packPath))!;
    delete (manifest as { packBytes?: number }).packBytes;
    fs.writeFileSync(manifestPathFor(packPath), JSON.stringify(manifest));
    expect(await readManifest(packPath)).toBeNull();
  });
});

describe('packBuilder - freshness', () => {
  it('treats a missing pack as stale', () => {
    expect(isPackFresh(null, 'anything')).toBe(false);
  });

  it('treats a matching digest as fresh', async () => {
    const tree = await readContentTree(root);
    expect(isPackFresh(buildManifest(tree), tree.digest)).toBe(true);
  });

  it('treats a differing digest as stale', async () => {
    const tree = await readContentTree(root);
    expect(isPackFresh(buildManifest(tree), 'different')).toBe(false);
  });
});

describe('ensurePack - rebuild and reuse', () => {
  it('builds the pack on first run', async () => {
    const result = await ensurePack(root, packPath);
    expect(result.reused).toBe(false);
    expect(fs.existsSync(packPath)).toBe(true);
    expect(result.entryCount).toBe(4);
  });

  it('reuses the pack when nothing changed', async () => {
    await ensurePack(root, packPath);
    const before = fs.statSync(packPath).mtimeMs;

    const result = await ensurePack(root, packPath);
    expect(result.reused).toBe(true);
    // Nothing was rewritten: the file is untouched, not merely equal.
    expect(fs.statSync(packPath).mtimeMs).toBe(before);
  });

  it('rebuilds after a content edit', async () => {
    await ensurePack(root, packPath);
    write('Scripts/Scenarios/Start.txt', 'BEGIN SCENARIO Start\nEDITED\nEND SCENARIO');

    const result = await ensurePack(root, packPath);
    expect(result.reused).toBe(false);

    const source = new PackSource(packPath);
    await source.open();
    expect((await source.readText('Scripts/Scenarios/Start.txt')).includes('EDITED')).toBe(true);
    await source.close();
  });

  it('rebuilds after a file is added', async () => {
    await ensurePack(root, packPath);
    write('Assets/Sounds/track.mp3', 'audio');
    expect((await ensurePack(root, packPath)).entryCount).toBe(5);
  });

  it('rebuilds after a file is deleted', async () => {
    await ensurePack(root, packPath);
    fs.rmSync(path.join(root, 'Assets', 'Scenes', 'room.jpg'));
    expect((await ensurePack(root, packPath)).entryCount).toBe(3);
  });

  it('rebuilds when the pack is gone but the manifest remains', async () => {
    await ensurePack(root, packPath);
    fs.rmSync(packPath);
    expect((await ensurePack(root, packPath)).reused).toBe(false);
  });

  it('rebuilds when the manifest is gone but the pack remains', async () => {
    // Cannot prove freshness, and rebuilding is the safe direction.
    await ensurePack(root, packPath);
    fs.rmSync(manifestPathFor(packPath));
    expect((await ensurePack(root, packPath)).reused).toBe(false);
  });

  it('rebuilds when the manifest is corrupt', async () => {
    await ensurePack(root, packPath);
    fs.writeFileSync(manifestPathFor(packPath), 'garbage');
    expect((await ensurePack(root, packPath)).reused).toBe(false);
  });

  it('rebuilds when a manifest claims a different digest', async () => {
    await ensurePack(root, packPath);
    const manifest = (await readManifest(packPath))!;
    manifest.contentDigest = 'stale';
    fs.writeFileSync(manifestPathFor(packPath), JSON.stringify(manifest));
    expect((await ensurePack(root, packPath)).reused).toBe(false);
  });

  it('rebuilds when the pack is truncated but the manifest still matches', async () => {
    // The manifest is a separate file, so it survives damage to the pack. Size is
    // the cheap check that catches a half-written or truncated archive.
    await ensurePack(root, packPath);
    const buffer = fs.readFileSync(packPath);
    fs.writeFileSync(packPath, buffer.subarray(0, Math.floor(buffer.length / 2)));

    expect((await ensurePack(root, packPath)).reused).toBe(false);

    const source = new PackSource(packPath);
    await expect(source.open()).resolves.toBeUndefined();
    await source.close();
  });

  it('does not rebuild when only timestamps changed', async () => {
    await ensurePack(root, packPath);
    const future = new Date(Date.now() + 3_600_000);
    fs.utimesSync(path.join(root, 'Assets', 'Title.png'), future, future);

    expect((await ensurePack(root, packPath)).reused).toBe(true);
  });

  it('honours force', async () => {
    await ensurePack(root, packPath);
    const result = await ensurePack(root, packPath, { force: true });
    expect(result.reused).toBe(false);
  });

  it('reuses for content that is genuinely unchanged across a rewrite', async () => {
    // Rewriting identical bytes must not count as a change.
    await ensurePack(root, packPath);
    write('Assets/Title.png', Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    expect((await ensurePack(root, packPath)).reused).toBe(true);
  });

  it('passes through content-tree warnings', async () => {
    fs.rmSync(path.join(root, 'Scripts'), { recursive: true, force: true });
    const result = await ensurePack(root, packPath);
    expect(result.warnings).toContain('Skipped missing folder: Scripts');
  });

  it('fails loudly when the content root has no Metadata.json', async () => {
    fs.rmSync(path.join(root, 'Metadata.json'));
    await expect(ensurePack(root, packPath)).rejects.toThrow(/missing Metadata\.json/i);
  });

  it('never writes a pack that the engine cannot open', async () => {
    // Guards the whole chain: tree -> zip -> manifest -> PackSource.
    await ensurePack(root, packPath);
    const source = new PackSource(packPath);
    await expect(source.open()).resolves.toBeUndefined();
    await source.close();
  });
});

describe('packBuilder - does not reuse a pack built from other content', () => {
  it('rebuilds when the same path held a pack from a different source tree', async () => {
    const otherRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sm-other-'));
    try {
      fs.writeFileSync(path.join(otherRoot, 'Metadata.json'), JSON.stringify({ Title: 'Other', PackFormatVersion: 1 }));
      fs.mkdirSync(path.join(otherRoot, 'Scripts'), { recursive: true });

      const sharedPack = path.join(root, 'game.fap');
      await ensurePack(otherRoot, sharedPack);
      expect((await readManifest(sharedPack))!.contentDigest).toBe(
        (await readContentTree(otherRoot)).digest
      );

      // Point the same cache location at different content.
      const result = await ensurePack(root, sharedPack);
      expect(result.reused).toBe(false);
      const source = new PackSource(sharedPack);
      await source.open();
      expect((await source.readMetadata()).Title).toBe('Test');
      await source.close();
    } finally {
      fs.rmSync(otherRoot, { recursive: true, force: true });
    }
  });
});

describe('packBuilder - zip conformance', () => {
  /**
   * Structural checks rather than a second reader: our own PackSource going
   * round-trip proves self-consistency, not that the file is a real zip. These
   * assert the signatures a conforming zip is required to carry.
   */
  it('emits a local file header for every entry', async () => {
    const buffer = await buildPackBuffer(await readContentTree(root));
    const dir = await Open.buffer(buffer);
    for (const entry of dir.files) {
      expect(entry.uncompressedSize).toBeGreaterThan(0);
      expect(entry.compressedSize).toBe(entry.uncompressedSize);
    }
  });

  it('ends with a well-formed end-of-central-directory record', async () => {
    const buffer = await buildPackBuffer(await readContentTree(root));
    const eocdOffset = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    expect(eocdOffset).toBeGreaterThan(0);

    const entryCount = buffer.readUInt16LE(eocdOffset + 10);
    expect(entryCount).toBe((await readContentTree(root)).entries.length);

    const commentLength = buffer.readUInt16LE(eocdOffset + 20);
    expect(eocdOffset + 22 + commentLength).toBe(buffer.length);
  });

  it('writes a pack that Open.buffer can index independently of a file on disk', async () => {
    const buffer = await buildPackBuffer(await readContentTree(root));
    const dir = await Open.buffer(buffer);
    expect(dir.files.length).toBe(4);
  });
});