import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { computeContentDigest, CONTENT_FOLDERS, readContentTree } from '../src/main/content/contentTree';
import { GameFolders } from '../src/services/GamePaths';

let root: string;

function write(entryPath: string, content: string | Buffer): void {
  const target = path.join(root, ...entryPath.split('/'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

/** A minimal but valid canonical content root. */
function seed(): void {
  write('Metadata.json', JSON.stringify({ Title: 'Test', PackFormatVersion: 1 }));
  write('Assets/Scenes/room.png', 'scene-bytes');
  write('Assets/Characters/Kenji/Shy.png', 'sprite-bytes');
  write('Scripts/Scenarios/Start.txt', 'BEGIN SCENARIO Start');
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'sm-tree-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('contentTree - reading the canonical layout', () => {
  it('reads Metadata.json, Assets and Scripts', async () => {
    seed();
    const tree = await readContentTree(root);

    expect(tree.entries.map(e => e.path)).toEqual([
      'Assets/Characters/Kenji/Shy.png',
      'Assets/Scenes/room.png',
      'Metadata.json',
      'Scripts/Scenarios/Start.txt',
    ]);
  });

  it('returns entries sorted by path so output is reproducible', async () => {
    seed();
    write('Assets/Sounds/z.mp3', 'z');
    write('Assets/Sounds/a.mp3', 'a');
    const tree = await readContentTree(root);

    const paths = tree.entries.map(e => e.path);
    expect(paths).toEqual([...paths].sort());
  });

  it('returns file contents unchanged', async () => {
    seed();
    const tree = await readContentTree(root);
    const scene = tree.entries.find(e => e.path === 'Assets/Scenes/room.png')!;
    expect(scene.data.toString('utf8')).toBe('scene-bytes');
  });

  it('preserves binary content byte for byte', async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff]);
    seed();
    write('Assets/Scenes/tiny.png', png);
    const tree = await readContentTree(root);
    const tiny = tree.entries.find(e => e.path === 'Assets/Scenes/tiny.png')!;
    expect(tiny.data.equals(png)).toBe(true);
  });

  it('ignores everything outside the canonical layout', async () => {
    seed();
    // Leftovers from the pre-FAP layout, plus ordinary project files. None of
    // these may reach the pack.
    write('Scenes/legacy.jpg', 'old');
    write('Scenarios/Start.txt', 'old');
    write('Characters/Kenji/Shy.png', 'old');
    write('Audio/track.mp3', 'old');
    write('src/main/main.ts', 'code');
    write('node_modules/left-pad/index.js', 'code');
    write('game.fap', 'not-a-pack');
    write('game.fap.manifest.json', '{}');

    const tree = await readContentTree(root);
    expect(tree.entries.map(e => e.path)).toEqual([
      'Assets/Characters/Kenji/Shy.png',
      'Assets/Scenes/room.png',
      'Metadata.json',
      'Scripts/Scenarios/Start.txt',
    ]);
  });

  it('treats a missing optional folder as a warning, not a failure', async () => {
    write('Metadata.json', JSON.stringify({ Title: 'Test' }));
    const tree = await readContentTree(root);

    expect(tree.entries.map(e => e.path)).toEqual(['Metadata.json']);
    expect(tree.warnings).toContain('Skipped missing folder: Assets');
    expect(tree.warnings).toContain('Skipped missing folder: Scripts');
  });

  it('nests as deeply as the layout needs', async () => {
    seed();
    write('Assets/Characters/Some Character/Deep/Nested/Sprite.png', 'x');
    const tree = await readContentTree(root);
    expect(tree.entries.some(e => e.path === 'Assets/Characters/Some Character/Deep/Nested/Sprite.png')).toBe(true);
  });

  it('keeps spaces in names intact', async () => {
    seed();
    write('Assets/Characters/Kenji and Yuki/Holding hands.png', 'x');
    const tree = await readContentTree(root);
    expect(tree.entries.some(e => e.path === 'Assets/Characters/Kenji and Yuki/Holding hands.png')).toBe(true);
  });
});

describe('contentTree - refusals', () => {
  it('throws when the root does not exist', async () => {
    await expect(readContentTree(path.join(root, 'nope'))).rejects.toThrow(/does not exist/i);
  });

  it('throws when Metadata.json is missing', async () => {
    write('Assets/Scenes/room.png', 'x');
    await expect(readContentTree(root)).rejects.toThrow(/missing Metadata\.json/i);
  });

  it('throws when Metadata.json is a directory rather than a file', async () => {
    fs.mkdirSync(path.join(root, 'Metadata.json'));
    await expect(readContentTree(root)).rejects.toThrow(/missing Metadata\.json/i);
  });

  it('refuses to follow a symlink out of the content root', async () => {
    // Windows needs elevation for symlinks, so a skip here is not a failure of
    // the rule being tested.
    let symlinksAvailable = true;
    try {
      fs.symlinkSync(path.join(os.tmpdir(), 'outside.txt'), path.join(root, 'Assets', 'escape.png'));
    } catch {
      symlinksAvailable = false;
    }
    if (!symlinksAvailable) {
      return;
    }

    seed();
    const tree = await readContentTree(root);
    expect(tree.entries.some(e => e.path === 'Assets/escape.png')).toBe(false);
    expect(tree.warnings).toContain('Skipped symbolic link: Assets/escape.png');
  });
});

describe('contentTree - digest', () => {
  it('is stable across two reads of the same content', async () => {
    seed();
    const first = await readContentTree(root);
    const second = await readContentTree(root);
    expect(first.digest).toBe(second.digest);
  });

  it('does not depend on file modification times', async () => {
    seed();
    const before = await readContentTree(root);

    // Touch every file well into the future. An mtime-based check would now
    // consider the cache stale; a content digest must not care.
    const future = new Date(Date.now() + 60_000);
    for (const entry of ['Metadata.json', 'Assets/Scenes/room.png']) {
      fs.utimesSync(path.join(root, ...entry.split('/')), future, future);
    }

    expect((await readContentTree(root)).digest).toBe(before.digest);
  });

  it('ignores the order entries were discovered in', () => {
    const a = { path: 'A/x', data: Buffer.from('1') };
    const b = { path: 'B/y', data: Buffer.from('2') };
    expect(computeContentDigest([a, b])).toBe(computeContentDigest([b, a]));
  });

  it('changes when a file is edited', async () => {
    seed();
    const before = await readContentTree(root);
    write('Assets/Scenes/room.png', 'scene-bytes-CHANGED');
    expect((await readContentTree(root)).digest).not.toBe(before.digest);
  });

  it('changes when a file keeps its size but differs', async () => {
    seed();
    const before = await readContentTree(root);
    // Same length, different bytes: catches a naive size-based freshness check.
    write('Assets/Scenes/room.png', 'scene-byteZ');
    const after = await readContentTree(root);
    expect(after.digest).not.toBe(before.digest);
  });

  it('changes when a file is added', async () => {
    seed();
    const before = await readContentTree(root);
    write('Assets/Sounds/new.mp3', 'x');
    expect((await readContentTree(root)).digest).not.toBe(before.digest);
  });

  it('changes when a file is deleted', async () => {
    seed();
    const before = await readContentTree(root);
    fs.rmSync(path.join(root, 'Assets', 'Scenes', 'room.png'));
    expect((await readContentTree(root)).digest).not.toBe(before.digest);
  });

  it('changes when a file is renamed', async () => {
    seed();
    const before = await readContentTree(root);
    fs.renameSync(
      path.join(root, 'Assets', 'Scenes', 'room.png'),
      path.join(root, 'Assets', 'Scenes', 'hall.png')
    );
    expect((await readContentTree(root)).digest).not.toBe(before.digest);
  });

  it('changes when a file only moves to a different folder', async () => {
    seed();
    const before = await readContentTree(root);
    fs.mkdirSync(path.join(root, 'Assets', 'Scenes', 'extra'), { recursive: true });
    fs.renameSync(
      path.join(root, 'Assets', 'Scenes', 'room.png'),
      path.join(root, 'Assets', 'Scenes', 'extra', 'room.png')
    );
    expect((await readContentTree(root)).digest).not.toBe(before.digest);
  });

  it('distinguishes the same bytes under two different names', () => {
    const data = Buffer.from('identical');
    expect(computeContentDigest([{ path: 'A/x', data }])).not.toBe(
      computeContentDigest([{ path: 'A/y', data }])
    );
  });

  it('is a sha256 hex digest', async () => {
    seed();
    expect((await readContentTree(root)).digest).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('contentTree - layout agreement', () => {
  it('agrees with the folder constants the renderer and engine use', () => {
    // If these drift apart, content would be read from folders and packed under
    // a different path, which fails silently at runtime.
    expect(CONTENT_FOLDERS).toContain(GameFolders.assets);
    expect(CONTENT_FOLDERS).toContain(GameFolders.scenarios.split('/')[0]);
    expect(CONTENT_FOLDERS).toHaveLength(2);
  });
});