import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { findPackIn } from '../src/main/content/locateGameSource';

/**
 * A pack built by `sm-cli` lives in the game's project folder, not in the
 * engine's `dist/` cache. Discovery has to find it before the engine decides to
 * auto-build, or the CLI pack is ignored and the engine plays an empty pack.
 */
describe('locateGameSource - finding a pre-built pack', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'sm-locate-pack-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  function touch(name: string): void {
    fs.writeFileSync(path.join(root, name), 'PK');
  }

  it('returns null when the folder holds no pack', () => {
    expect(findPackIn(root)).toBeNull();
  });

  it('returns null for a folder that does not exist', () => {
    expect(findPackIn(path.join(root, 'missing'))).toBeNull();
  });

  it('prefers game.fap over other packs', () => {
    touch('alpha.fap');
    touch('game.fap');
    expect(findPackIn(root)).toBe(path.join(root, 'game.fap'));
  });

  it('falls back to the first other pack by sorted name', () => {
    touch('zeta.fap');
    touch('alpha.fap');
    expect(findPackIn(root)).toBe(path.join(root, 'alpha.fap'));
  });

  it('matches game.fap regardless of casing on disk', () => {
    touch('Game.FAP');
    expect(findPackIn(root)?.toLowerCase()).toBe(path.join(root, 'Game.FAP').toLowerCase());
  });

  it('ignores files that only contain .fap in the middle of the name', () => {
    touch('game.fap.backup');
    touch('game.fap.manifest.json');
    expect(findPackIn(root)).toBeNull();
  });

  it('ignores directories named like a pack', () => {
    fs.mkdirSync(path.join(root, 'game.fap'));
    expect(findPackIn(root)).toBeNull();
  });
});
