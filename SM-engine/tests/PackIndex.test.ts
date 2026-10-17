import { describe, it, expect } from 'vitest';
import { PackIndex } from '../src/main/content/PackIndex';
import type { UnzipperEntry } from 'unzipper';

function entry(path: string, overrides: Partial<UnzipperEntry> = {}): UnzipperEntry {
  return {
    path,
    type: 'File',
    flags: 0,
    compressionMethod: 0,
    crc32: 0,
    compressedSize: 0,
    uncompressedSize: 10,
    stream: () => {
      throw new Error('not used in these tests');
    },
    buffer: () => {
      throw new Error('not used in these tests');
    },
    ...overrides,
  } as UnzipperEntry;
}

describe('PackIndex - admission', () => {
  it('indexes ordinary entries under their normalized path', () => {
    const index = new PackIndex();
    expect(index.add('Assets/Scenes/x.png', entry('Assets/Scenes/x.png'))).toBe(true);
    expect(index.has('Assets/Scenes/x.png')).toBe(true);
    expect(index.size).toBe(1);
  });

  it('treats lookups as normalization-insensitive', () => {
    const index = new PackIndex();
    index.add('Assets/Scenes/x.png', entry('Assets/Scenes/x.png'));
    expect(index.has('/Assets/Scenes/x.png')).toBe(true);
    expect(index.has('./Assets/Scenes/x.png')).toBe(true);
  });

  it('is case-sensitive, unlike the loose folders it mirrors', () => {
    const index = new PackIndex();
    index.add('Assets/Scenes/TempleGarden.jpg', entry('Assets/Scenes/TempleGarden.jpg'));
    expect(index.has('Assets/Scenes/TempleGarden.jpg')).toBe(true);
    expect(index.has('Assets/Scenes/templegarden.jpg')).toBe(false);
  });

  it('ignores directory entries', () => {
    const index = new PackIndex();
    expect(index.add('Assets/', entry('Assets/', { type: 'Directory' }))).toBe(false);
    expect(index.size).toBe(0);
  });
});

describe('PackIndex - hostile entry rejection', () => {
  const hostile = [
    '../escape.txt',
    'Assets/../../escape.txt',
    '/absolute.txt',
    'C:/windows/x.ini',
    'Assets\\Scenes\\x.png',
  ];

  for (const name of hostile) {
    it(`rejects ${name}`, () => {
      const index = new PackIndex();
      expect(index.add(name, entry(name))).toBe(false);
      expect(index.size).toBe(0);
      expect(index.rejectedPaths).toContain(name);
    });
  }

  it('keeps good entries when rejecting bad ones', () => {
    const index = new PackIndex();
    index.add('Metadata.json', entry('Metadata.json'));
    index.add('../escape.txt', entry('../escape.txt'));
    expect(index.size).toBe(1);
    expect(index.has('Metadata.json')).toBe(true);
  });
});

describe('PackIndex - encryption detection', () => {
  it('reports no password needed for a plaintext pack', () => {
    const index = new PackIndex();
    index.add('Metadata.json', entry('Metadata.json', { flags: 0 }));
    expect(index.requiresPassword).toBe(false);
  });

  it('detects the encryption bit on a single entry', () => {
    const index = new PackIndex();
    index.add('Metadata.json', entry('Metadata.json', { flags: 0 }));
    index.add('Assets/Scenes/x.png', entry('Assets/Scenes/x.png', { flags: 0x1 }));
    expect(index.requiresPassword).toBe(true);
    expect(index.isEncrypted('Assets/Scenes/x.png')).toBe(true);
    expect(index.isEncrypted('Metadata.json')).toBe(false);
  });

  it('ignores the UTF-8 name bit when deciding encryption', () => {
    const index = new PackIndex();
    index.add('Metadata.json', entry('Metadata.json', { flags: 0x800 }));
    expect(index.requiresPassword).toBe(false);
  });
});
