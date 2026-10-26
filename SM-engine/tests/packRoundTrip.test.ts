import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import yazl from 'yazl';
import { PackSource } from '../src/main/content/PackSource';
import { GameEngine } from '../src/main/gameEngine';
import { GameState } from '../src/services/GameState';
import {
  GameFolders,
  METADATA_FILE,
  assetBaseUrl,
  sceneUrl,
  characterUrl,
  titleImageUrl,
} from '../src/services/GamePaths';
import { CONTENT_PATHS, repoContentRoot } from './helpers/contentSource';

/**
 * Mirrors what the protocol handler does with an incoming request URL, so that
 * the URL the renderer builds and the entry key the pack indexes are proven to
 * agree. A mismatch here is what produces a blank image at runtime.
 */
function entryPathFromUrl(url: string): string {
  const withoutScheme = url.replace(/^sm:\/\/game\//, '');
  return decodeURIComponent(withoutScheme);
}

let tempDir: string;
let packPath: string;

function buildPack(targetPath: string, entries: Record<string, string | Buffer>): Promise<void> {
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

beforeAll(async () => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sm-fap-roundtrip-'));
  packPath = path.join(tempDir, 'game.fap');

  // Entry names are built from the shared folder constants, so this pack
  // cannot drift away from the layout the renderer and engine ask for.
  await buildPack(packPath, {
    [METADATA_FILE]: fs.readFileSync(path.join(repoContentRoot(), METADATA_FILE), 'utf8'),
    [`${GameFolders.scenarios}/Start.txt`]: fs.readFileSync(
      path.join(repoContentRoot(), CONTENT_PATHS.startScenario)
    ),
    [`${GameFolders.scenarios}/insidethetower.txt`]: fs.readFileSync(
      path.join(repoContentRoot(), CONTENT_PATHS.innerScenario)
    ),
    [`${GameFolders.scenes}/insidetower.jpg`]: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    [`${GameFolders.characters}/Kenji/Shy.png`]: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    [`${GameFolders.assets}/Title.png`]: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    [`${GameFolders.sounds}/cicadas-at-dusk.mp3`]: Buffer.from('ID3'),
  });
});

afterAll(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('pack round trip - URLs resolve to pack entries', () => {
  let source: PackSource;

  beforeAll(async () => {
    source = new PackSource(packPath);
    await source.open();
  });

  afterAll(async () => {
    await source.close();
  });

  it('resolves the scene URL to a real entry', () => {
    const entry = entryPathFromUrl(sceneUrl('insidetower', 'jpg'));
    expect(entry).toBe('Assets/Scenes/insidetower.jpg');
    expect(source.exists(entry)).toBe(true);
  });

  it('resolves the character URL to a real entry', () => {
    const entry = entryPathFromUrl(characterUrl('Kenji', 'Shy'));
    expect(entry).toBe('Assets/Characters/Kenji/Shy.png');
    expect(source.exists(entry)).toBe(true);
  });

  it('resolves the title URL to a real entry', () => {
    const entry = entryPathFromUrl(titleImageUrl('Title', 'png'));
    expect(entry).toBe('Assets/Title.png');
    expect(source.exists(entry)).toBe(true);
  });

  it('resolves the sound base path to real entries', () => {
    const entry = entryPathFromUrl(`${assetBaseUrl(GameFolders.sounds)}cicadas-at-dusk.mp3`);
    expect(entry).toBe('Assets/Sounds/cicadas-at-dusk.mp3');
    expect(source.exists(entry)).toBe(true);
  });

  it('serves bytes for every media type the renderer loads', async () => {
    for (const url of [
      sceneUrl('insidetower', 'jpg'),
      characterUrl('Kenji', 'Shy'),
      titleImageUrl('Title', 'png'),
    ]) {
      const buffer = await source.readBuffer(entryPathFromUrl(url));
      expect(buffer.length).toBeGreaterThan(0);
    }
  });

  it('reports a usable size for range requests', () => {
    expect(source.size(entryPathFromUrl(sceneUrl('insidetower', 'jpg')))).toBe(4);
  });
});

describe('pack round trip - engine runs off a pack', () => {
  it('plays through a choice fork with the pack as its only content source', async () => {
    const packedSource = new PackSource(packPath);
    await packedSource.open();

    const engine = new GameEngine(null, packedSource);
    await engine.initialize();

    GameState.getInstance().setCurrentLine(0);
    await engine.runScenario();
    await engine.runScenario();
    await engine.runScenario();

    const selector = GameState.getInstance().getRunningScenario().CurrentChoiceSelector;
    expect(selector).toBeDefined();

    const towerLine = selector.Choices['Go inside the tower with Yuki'];
    await engine.selectChoice('Go inside the tower with Yuki', towerLine);
    await engine.runScenario();

    expect(GameState.getInstance().getRunningScenario().Name).toBe('insidethetower');
    await packedSource.close();
  });

  it('reads the title screen image name from pack metadata', async () => {
    const packedSource = new PackSource(packPath);
    await packedSource.open();
    const metadata = await packedSource.readMetadata();
    expect(metadata.PackFormatVersion).toBe(1);
    expect(metadata.TitleScreenImageName).toBe('Title');

    // The renderer builds the title URL from this field, so the pack has to
    // actually contain it or the title screen silently fails to load.
    const entry = entryPathFromUrl(titleImageUrl(metadata.TitleScreenImageName, 'png'));
    expect(packedSource.exists(entry)).toBe(true);
    await packedSource.close();
  });
});
