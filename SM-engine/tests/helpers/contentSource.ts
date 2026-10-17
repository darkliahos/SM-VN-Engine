import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { GameSource } from '../../src/main/content/GameSource';
import { PackSource } from '../../src/main/content/PackSource';
import { ensurePack } from '../../src/main/content/packBuilder';

/**
 * The engine's own content folders, in the canonical layout. vitest runs with
 * SM-engine as its working directory, which is the same root the engine falls
 * back to in development.
 */
export function repoContentRoot(): string {
  return process.cwd();
}

export async function looseContentSource(): Promise<GameSource> {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sm-test-pack-'));
  try {
    const packPath = path.join(cacheDir, 'test.fap');
    await ensurePack(repoContentRoot(), packPath);
    const source = new PackSource(packPath);
    await source.open();
    return source;
  } catch (err) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    throw err;
  }
}

export const CONTENT_PATHS = {
  metadata: 'Metadata.json',
  startScenario: 'Scripts/Scenarios/Start.txt',
  innerScenario: 'Scripts/Scenarios/insidethetower.txt',
  titleImage: 'Assets/Title.png',
  scene: 'Assets/Scenes/insidetower.jpg',
  characterSprite: 'Assets/Characters/Kenji/Shy.png',
  sound: 'Assets/Sounds/cicadas-at-dusk.mp3',
};

export const CONTENT_ABS = {
  startScenario: path.join(repoContentRoot(), 'Scripts', 'Scenarios', 'Start.txt'),
};
