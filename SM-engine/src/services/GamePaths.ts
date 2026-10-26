/**
 * Canonical game content paths and URL builders.
 *
 * This module is shared by the main process (compiled by tsc) and the renderer
 * (bundled by esbuild), so it must not import node or electron modules.
 */

export const SCHEME = 'sm';
export const PACK_HOST = 'game';

/** Folder names inside the game root, in the canonical FAP layout. */
export const GameFolders = {
  assets: 'Assets',
  characters: 'Assets/Characters',
  scenes: 'Assets/Scenes',
  sounds: 'Assets/Sounds',
  scenarios: 'Scripts/Scenarios',
} as const;

export const METADATA_FILE = 'Metadata.json';

export const PACK_EXTENSION = '.fap';

/** Extension probe chains, tried in order by the renderer's onerror fallbacks. */
export const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg'] as const;
export const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg'] as const;

/**
 * Rejects entry names that could escape the game root or that do not conform to
 * the pack spec: `..` segments, absolute prefixes, and backslashes.
 */
export function isSafeEntryPath(entryPath: string): boolean {
  if (!entryPath || entryPath.startsWith('/') || entryPath.includes('\\')) {
    return false;
  }
  if (/^[A-Za-z]:/.test(entryPath)) {
    return false;
  }
  return entryPath.split('/').every(segment => segment !== '..' && segment !== '.');
}

/**
 * Normalizes a pack-relative path to the canonical form used as an index key:
 * forward slashes, no leading slash, no redundant segments.
 */
export function normalizeEntryPath(entryPath: string): string {
  return entryPath
    .split('/')
    .filter(segment => segment !== '' && segment !== '.')
    .join('/');
}

/**
 * Builds an absolute `sm://game/<path>` URL. Relative URLs do not work with
 * handled schemes.
 *
 * Callers pass folder constants like `Assets/Scenes` as a single segment, so
 * each segment is split on `/` first: encoding the whole segment would escape
 * the separators and produce `Assets%2FScenes`, which is a different key from
 * the one the pack index uses.
 */
export function assetUrl(...segments: string[]): string {
  const encoded = segments
    .flatMap(segment => segment.split('/'))
    .filter(segment => segment !== '')
    .map(encodeURIComponent);
  return `${SCHEME}://${PACK_HOST}/${encoded.join('/')}`;
}

/** Builds the `sm://game/<folder>/` prefix used as an asset base path. */
export function assetBaseUrl(folder: string): string {
  return `${SCHEME}://${PACK_HOST}/${folder.replace(/\/+$/, '')}/`;
}

export function sceneUrl(name: string, extension: string): string {
  return assetUrl(GameFolders.scenes, `${name}.${extension}`);
}

export function characterUrl(characterName: string, spriteName: string, extension = 'png'): string {
  return assetUrl(GameFolders.characters, characterName, `${spriteName}.${extension}`);
}

export function titleImageUrl(imageName: string, extension: string): string {
  return assetUrl(GameFolders.assets, `${imageName}.${extension}`);
}

export function soundUrl(basePath: string, fileName: string, extension: string): string {
  return `${basePath.replace(/\/+$/, '')}/${fileName}.${extension}`;
}

const MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  flac: 'audio/flac',
  txt: 'text/plain',
  json: 'application/json',
  html: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
};

export function mimeTypeFor(entryPath: string): string {
  const dot = entryPath.lastIndexOf('.');
  if (dot === -1) {
    return 'application/octet-stream';
  }
  return MIME_TYPES[entryPath.slice(dot + 1).toLowerCase()] ?? 'application/octet-stream';
}
