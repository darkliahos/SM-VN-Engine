import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { isSafeEntryPath, METADATA_FILE } from '../../services/GamePaths';

/**
 * Reads a game's content out of loose folders, in the canonical layout, ready to
 * be written into a `.fap`.
 *
 * This is the only place the engine looks at the filesystem directly. Once the
 * content has been through here it lives in the pack, so nothing downstream needs
 * to know the content started as folders.
 *
 * Deliberately free of any `electron` import so the pack tool and the engine can
 * share one implementation.
 */

/** Top-level folders of the canonical layout. Anything else in the root is ignored. */
export const CONTENT_FOLDERS = ['Assets', 'Scripts'] as const;

export interface ContentEntry {
  /** Canonical path inside the pack, e.g. `Assets/Scenes/room.png`. */
  path: string;
  data: Buffer;
}

export interface ContentTree {
  /** Source root the entries were read from. */
  root: string;
  /** Sorted by path, so a tree is reproducible. */
  entries: ContentEntry[];
  /** Digest over every entry's path and content. See `computeContentDigest`. */
  digest: string;
  /** Entries that were skipped, with the reason. Never fatal. */
  warnings: string[];
}

/**
 * A digest of everything that would end up in the pack.
 *
 * Content-hashed rather than timestamped on purpose. An mtime comparison looks
 * cheaper but is wrong in ways that are painful to debug: an edit that lands in
 * the same second, a clock change, or a deleted file whose pack is still newer
 * than every remaining file all read as "fresh" while serving stale content.
 */
export function computeContentDigest(entries: ContentEntry[]): string {
  const hash = createHash('sha256');
  for (const entry of [...entries].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))) {
    hash.update(entry.path);
    hash.update('\0');
    hash.update(createHash('sha256').update(entry.data).digest('hex'));
    hash.update('\n');
  }
  return hash.digest('hex');
}

/**
 * Reads the canonical layout from `root` into memory.
 *
 * Throws when `Metadata.json` is absent, since a pack without it is not a
 * content set the engine can use. Everything else is reported through
 * `warnings` and skipped, matching how a pack treats entries it cannot admit.
 */
export async function readContentTree(root: string): Promise<ContentTree> {
  const resolvedRoot = path.resolve(root);
  if (!fs.existsSync(resolvedRoot)) {
    throw new Error(`Content root does not exist: ${resolvedRoot}`);
  }

  const entries: ContentEntry[] = [];
  const warnings: string[] = [];

  const metadataPath = path.join(resolvedRoot, METADATA_FILE);
  if (!fs.existsSync(metadataPath) || !fs.statSync(metadataPath).isFile()) {
    throw new Error(
      `Content root is missing ${METADATA_FILE}: ${resolvedRoot}. ` +
        'A content root must use the canonical layout.'
    );
  }
  await collect(metadataPath, METADATA_FILE, entries, warnings);

  for (const folder of CONTENT_FOLDERS) {
    await walk(path.join(resolvedRoot, folder), folder, entries, warnings);
  }

  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { root: resolvedRoot, entries, digest: computeContentDigest(entries), warnings };
}

async function walk(
  absoluteDir: string,
  entryDir: string,
  entries: ContentEntry[],
  warnings: string[]
): Promise<void> {
  let dirents: fs.Dirent[];
  try {
    dirents = await fsp.readdir(absoluteDir, { withFileTypes: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      // A missing optional folder is normal; a partially migrated tree should
      // not stop the engine from starting.
      warnings.push(`Skipped missing folder: ${entryDir}`);
      return;
    }
    throw err;
  }

  // Sorted so two runs over identical content produce identical output.
  for (const dirent of [...dirents].sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = path.join(absoluteDir, dirent.name);
    const entryPath = `${entryDir}/${dirent.name}`;

    if (dirent.isSymbolicLink()) {
      // Following a link would let content escape the root, and the link target
      // is invisible in the resulting pack.
      warnings.push(`Skipped symbolic link: ${entryPath}`);
      continue;
    }

    if (dirent.isDirectory()) {
      await walk(absolute, entryPath, entries, warnings);
      continue;
    }

    if (!dirent.isFile()) {
      warnings.push(`Skipped non-file entry: ${entryPath}`);
      continue;
    }

    await collect(absolute, entryPath, entries, warnings);
  }
}

async function collect(
  absolute: string,
  entryPath: string,
  entries: ContentEntry[],
  warnings: string[]
): Promise<void> {
  if (!isSafeEntryPath(entryPath)) {
    warnings.push(`Skipped unsafe entry path: ${entryPath}`);
    return;
  }
  entries.push({ path: entryPath, data: await fsp.readFile(absolute) });
}