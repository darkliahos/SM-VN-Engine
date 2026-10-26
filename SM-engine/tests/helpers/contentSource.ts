import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { GameSource } from '../../src/main/content/GameSource';
import { PackSource } from '../../src/main/content/PackSource';
import { ensurePack } from '../../src/main/content/packBuilder';

/**
 * The content root used by tests that need a real, playable game.
 *
 * The sample project lives in `SM-cli`, which is also what produces the `.fap`
 * the engine plays. `SM_CONTENT_ROOT` can point at another project when the
 * layout is not the usual sibling checkout.
 */
export function repoContentRoot(): string {
  const candidates = [
    process.env.SM_CONTENT_ROOT,
    process.cwd(),
    path.resolve(process.cwd(), '..', 'SM-cli'),
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === 'string' &&
      candidate !== '' &&
      fs.existsSync(path.join(candidate, 'Metadata.json')) &&
      fs.existsSync(path.join(candidate, 'Scripts', 'Scenarios', 'Start.txt'))
    ) {
      return candidate;
    }
  }

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
