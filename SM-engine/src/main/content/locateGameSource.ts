import * as path from 'path';
import { app } from 'electron';
import { PACK_EXTENSION } from '../../services/GamePaths';
import { GameSource } from './GameSource';
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

  // Development runs straight from the repository root. The loose-folder
  // development path has been removed; the engine only ever reads a pack.
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
 * Opens the game's content. The engine reads *only* a `.fap`. At launch, a pack
 * is either supplied via `--pack`, or it is built (and reused when fresh) from
 * the canonical source layout.
 */
export async function openGameSource(): Promise<GameSource> {
  const explicit = explicitPackPath();
  if (explicit) {
    const source = new PackSource(explicit);
    await source.open();
    return source;
  }

  const sourceRoot = resolveSourceRoot();
  const cachePack = cachedPackPath();
  if (!sourceRoot || !cachePack) {
    throw new Error('Cannot determine where to read game content from.');
  }

  // `ensurePack` builds the pack only when stale; when reused, nothing is
  // written and the existing pack is considered current.
  const built = await ensurePack(sourceRoot, cachePack);

  const source = new PackSource(cachePack);
  await source.open();

  // Attach the build information to the instance's description to avoid leaking
  // internal state. The caller may log `source.description` and `source.entryCount`.
  (source as unknown as { buildMeta?: Record<string, unknown> }).buildMeta = {
    reused: built.reused,
    warnings: built.warnings,
    cachePack,
    sourceRoot,
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
