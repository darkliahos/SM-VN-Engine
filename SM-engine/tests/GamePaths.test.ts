import { describe, it, expect } from 'vitest';
import {
  isSafeEntryPath,
  normalizeEntryPath,
  assetUrl,
  assetBaseUrl,
  sceneUrl,
  characterUrl,
  titleImageUrl,
  mimeTypeFor,
  GameFolders,
  METADATA_FILE,
} from '../src/services/GamePaths';

describe('GamePaths - hostile path rejection', () => {
  it('rejects parent directory segments', () => {
    expect(isSafeEntryPath('../secrets.txt')).toBe(false);
    expect(isSafeEntryPath('Assets/../../etc/passwd')).toBe(false);
    expect(isSafeEntryPath('..')).toBe(false);
  });

  it('rejects absolute paths and drive letters', () => {
    expect(isSafeEntryPath('/etc/passwd')).toBe(false);
    expect(isSafeEntryPath('C:/Windows/system.ini')).toBe(false);
    expect(isSafeEntryPath('c:\\windows\\system.ini')).toBe(false);
  });

  it('rejects backslashes', () => {
    expect(isSafeEntryPath('Assets\\Scenes\\x.png')).toBe(false);
  });

  it('rejects empty and single-dot paths', () => {
    expect(isSafeEntryPath('')).toBe(false);
    expect(isSafeEntryPath('./x.png')).toBe(false);
  });

  it('accepts ordinary canonical paths', () => {
    expect(isSafeEntryPath('Metadata.json')).toBe(true);
    expect(isSafeEntryPath('Assets/Scenes/insidetower.jpg')).toBe(true);
    expect(isSafeEntryPath('Assets/Characters/Kenji/Shy.png')).toBe(true);
    expect(isSafeEntryPath('Scripts/Scenarios/Start.txt')).toBe(true);
  });
});

describe('GamePaths - normalization', () => {
  it('collapses redundant separators and dot segments', () => {
    expect(normalizeEntryPath('/Assets/Scenes/x.png')).toBe('Assets/Scenes/x.png');
    expect(normalizeEntryPath('Assets//Scenes/x.png')).toBe('Assets/Scenes/x.png');
    expect(normalizeEntryPath('./Assets/x.png')).toBe('Assets/x.png');
  });

  it('treats a path as unchanged when already canonical', () => {
    expect(normalizeEntryPath('Metadata.json')).toBe('Metadata.json');
  });
});

describe('GamePaths - URL builders', () => {
  it('builds absolute sm:// URLs', () => {
    expect(assetUrl('Metadata.json')).toBe('sm://game/Metadata.json');
    expect(assetUrl('Assets', 'Scenes', 'x.png')).toBe('sm://game/Assets/Scenes/x.png');
  });

  it('builds the canonical asset URLs', () => {
    expect(sceneUrl('insidetower', 'jpg')).toBe('sm://game/Assets/Scenes/insidetower.jpg');
    expect(characterUrl('Kenji', 'Shy')).toBe('sm://game/Assets/Characters/Kenji/Shy.png');
    expect(titleImageUrl('title', 'png')).toBe('sm://game/Assets/title.png');
  });

  it('builds a folder base URL with a trailing slash', () => {
    expect(assetBaseUrl(GameFolders.sounds)).toBe('sm://game/Assets/Sounds/');
    expect(assetBaseUrl('Assets/Sounds/')).toBe('sm://game/Assets/Sounds/');
  });

  it('produces absolute URLs, never relative ones', () => {
    // Electron treats handled schemes as network requests, so relative paths
    // would resolve against the renderer's own origin and fail.
    expect(assetUrl('Assets', 'x.png').startsWith('sm://')).toBe(true);
    expect(sceneUrl('a', 'png').startsWith('/')).toBe(false);
  });
});

describe('GamePaths - mime types', () => {
  it('maps known media extensions', () => {
    expect(mimeTypeFor('Assets/Scenes/x.png')).toBe('image/png');
    expect(mimeTypeFor('Assets/Scenes/x.JPG')).toBe('image/jpeg');
    expect(mimeTypeFor('Assets/Sounds/x.mp3')).toBe('audio/mpeg');
    expect(mimeTypeFor('Assets/Sounds/x.ogg')).toBe('audio/ogg');
  });

  it('maps text and metadata', () => {
    expect(mimeTypeFor('Scripts/Scenarios/Start.txt')).toBe('text/plain');
    expect(mimeTypeFor(METADATA_FILE)).toBe('application/json');
  });

  it('falls back to octet-stream for unknown and extensionless paths', () => {
    expect(mimeTypeFor('Assets/Scenes/x.xyz')).toBe('application/octet-stream');
    expect(mimeTypeFor('Assets/Scenes/noextension')).toBe('application/octet-stream');
  });
});

describe('GamePaths - canonical layout', () => {
  it('points at the layout the pack standard defines', () => {
    expect(GameFolders.characters).toBe('Assets/Characters');
    expect(GameFolders.scenes).toBe('Assets/Scenes');
    expect(GameFolders.sounds).toBe('Assets/Sounds');
    expect(GameFolders.scenarios).toBe('Scripts/Scenarios');
    expect(METADATA_FILE).toBe('Metadata.json');
  });
});
