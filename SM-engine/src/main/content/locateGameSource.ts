import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { PACK_EXTENSION } from '../../services/GamePaths';
import { BadPasswordError, GameSource } from './GameSource';
import { PackSource } from './PackSource';
import { ensurePack } from './packBuilder';

/** Default pack name written/read from the cache. */
export const DEFAULT_PACK_NAME = `game${PACK_EXTENSION}`;

const MANIFEST_EXTENSION = '.manifest.json';

/**
 * Resolves the directory that contains the source content files (the canonical
 * layout). These are only used as an input to build the pack, never read at
 * runtime.
 */
export function resolveSourceRoot(): string {
  const explicit = packPathFromArgv();
  if (explicit) {
    // When a specific pack is passed, there is no "source folder" to build from.
    return '';
  }

  if (app?.isPackaged && process.resourcesPath) {
    // Packaged builds ship the source content as extraResources alongside the
    // built app. They are never edited at runtime, but they are the input that
    // produces the cached pack in userData.
    return process.resourcesPath;
  }

  // Development runs from the staged build directory, which `copy-assets`
  // populates in the canonical layout. The engine only ever reads a pack; this
  // folder is the input for the launch-time auto-build fallback.
  return path.resolve(__dirname, '..', '..');
}

/**
 * Resolves the directory where the cached pack should live. Writing to
 * userData for packaged builds avoids trying to modify files in Program Files.
 */
export function resolvePackCacheDir(): string {
  const explicit = packPathFromArgv();
  if (explicit) {
    // An explicitly-provided pack is used as-is, no cache is needed.
    return '';
  }

  if (app?.isPackaged && app?.getPath) {
    return app.getPath('userData');
  }

  // Development writes the cache next to the source content for easy inspection.
  return resolveSourceRoot();
}

/** Reads `--pack <path>` / `--pack=<path>` from argv, if present. */
export function packPathFromArgv(argv: string[] = process.argv): string | null {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--pack' && argv[i + 1]) {
      return argv[i + 1];
    }
    if (arg.startsWith('--pack=')) {
      return arg.slice('--pack='.length);
    }
  }
  return null;
}

/** Returns the pack path to open when `--pack` is provided. */
export function explicitPackPath(): string | null {
  const explicit = packPathFromArgv();
  if (!explicit) {
    return null;
  }
  const resolved = path.resolve(explicit);
  return resolved;
}

/** Returns the cache pack path when the engine should auto-build from source. */
export function cachedPackPath(): string | null {
  const cacheDir = resolvePackCacheDir();
  if (cacheDir === '') {
    return null;
  }
  return path.join(cacheDir, DEFAULT_PACK_NAME);
}

/**
 * Finds a `.fap` that is already sitting in `root`.
 *
 * `game.fap` wins; otherwise the first other `.fap` by sorted name is used, so
 * a shipped pack with a title-specific name still loads. Returns null when the
 * folder does not exist or holds no pack.
 */
export function findPackIn(root: string): string | null {
  if (!root) {
    return null;
  }

  let names: string[];
  try {
    names = fs
      .readdirSync(root, { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith(PACK_EXTENSION))
      .map(entry => entry.name)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return null;
  }

  if (names.length === 0) {
    return null;
  }

  const preferred = names.find(name => name.toLowerCase() === DEFAULT_PACK_NAME.toLowerCase());
  return path.join(root, preferred ?? names[0]);
}

/**
 * Folders a pre-built pack may live in, in precedence order.
 *
 * Pack authoring is an offline concern (`sm-cli pack`), so an existing pack is
 * always preferred over building one at launch. The project root is checked
 * before the working directory so a CLI-built pack next to the sources wins
 * over the engine's own auto-build cache in `dist/`, which is never searched
 * here.
 */
export function candidatePackRoots(): string[] {
  if (app?.isPackaged && process.resourcesPath) {
    return [process.resourcesPath];
  }

  const roots = [
    // Compiled main lives in <project>/dist/main/content.
    path.resolve(__dirname, '..', '..', '..'),
    process.cwd(),
  ];

  const unique: string[] = [];
  for (const root of roots) {
    if (!unique.some(existing => existing.toLowerCase() === root.toLowerCase())) {
      unique.push(root);
    }
  }
  return unique;
}

/** Returns the first pre-built pack in the candidate roots, or null. */
export function locatePack(): string | null {
  for (const root of candidatePackRoots()) {
    const pack = findPackIn(root);
    if (pack) {
      return pack;
    }
  }
  return null;
}

/** Opens a pack and maps a bad key file onto an actionable startup error. */
async function openPack(packPath: string): Promise<PackSource> {
  const source = new PackSource(packPath);
  try {
    await source.open();
  } catch (err) {
    if (err instanceof BadPasswordError) {
      throw new Error(
        `A valid game.key file is required to unlock this game.\n\n` +
        `Expected key file: ${packPath.replace(/\.fap$/i, '.key')}\n\n` +
        `Details: ${err.message}`
      );
    }
    throw err;
  }
  return source;
}

/**
 * Opens the game's content. The engine reads *only* a `.fap`.
 *
 * A pack is found, in order, from `--pack`, from the folder next to a packaged
 * build, or from the project root / working directory in development. Only when
 * no pack exists at all does the engine fall back to building its own cache from
 * the canonical loose-folder layout, so a pack produced by `sm-cli` is always
 * played as-is and never regenerated.
 *
 * For encrypted packs the engine automatically resolves the password by reading
 * the companion `game.key` file (Approach 3 — AES-256-GCM encoded key file).
 * If the key file is absent or tampered with, a descriptive error is thrown so
 * the caller can show an appropriate dialog.
 */
export async function openGameSource(): Promise<GameSource> {
  const explicit = explicitPackPath();
  if (explicit) {
    return openPack(explicit);
  }

  // Prefer a pack that already exists: it was authored by `sm-cli` (or shipped
  // next to a packaged build) and must never be regenerated or overwritten.
  const located = locatePack();
  if (located) {
    const source = await openPack(located);
    (source as unknown as { buildMeta?: Record<string, unknown> }).buildMeta = {
      reused: true,
      warnings: [],
      cachePack: located,
      sourceRoot: path.dirname(located),
      origin: 'existing pack',
    };
    return source;
  }

  const sourceRoot = resolveSourceRoot();
  const cachePack = cachedPackPath();
  if (!sourceRoot || !cachePack) {
    throw new Error('Cannot determine where to read game content from.');
  }

  // No pack was found, so fall back to the development convenience of building
  // one from the canonical loose-folder layout. `ensurePack` only writes when
  // the cache is missing or stale, and the cache never outranks a real pack.
  const built = await ensurePack(sourceRoot, cachePack);

  const source = await openPack(cachePack);

  // Attach the build information to the instance's description to avoid leaking
  // internal state. The caller may log `source.description` and `source.entryCount`.
  (source as unknown as { buildMeta?: Record<string, unknown> }).buildMeta = {
    reused: built.reused,
    warnings: built.warnings,
    cachePack,
    sourceRoot,
    origin: 'auto-built cache',
  };

  return source;
}

/**
 * Removes any cached pack and its manifest from the cache directory. Intended
 * for testing and for explicit "clean rebuild" scenarios.
 */
export async function clearCachedPack(): Promise<void> {
  const cachePack = cachedPackPath();
  if (!cachePack) {
    return;
  }
  const { promises: fsp } = await import('fs');
  await fsp.rm(cachePack, { force: true });
  await fsp.rm(`${cachePack}${MANIFEST_EXTENSION}`, { force: true });
}
