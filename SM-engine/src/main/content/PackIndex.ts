import type { UnzipperEntry } from 'unzipper';
import { isSafeEntryPath, normalizeEntryPath } from '../../services/GamePaths';

const ENCRYPTION_BIT = 0x1;

/**
 * The set of usable entries in a pack, keyed by normalized pack-relative path.
 *
 * Hostile entry names are rejected at index time rather than at read time, so a
 * malformed pack cannot smuggle a path past the read path later.
 */
export class PackIndex {
  private entries: Map<string, UnzipperEntry> = new Map();
  private rejected: string[] = [];
  private sawEncrypted = false;

  /** Adds an entry. Returns false if the name was rejected as unsafe. */
  public add(rawPath: string, entry: UnzipperEntry): boolean {
    if (entry.type !== 'File') {
      return false;
    }
    if (!isSafeEntryPath(rawPath)) {
      this.rejected.push(rawPath);
      return false;
    }

    const key = normalizeEntryPath(rawPath);
    if (key === '') {
      this.rejected.push(rawPath);
      return false;
    }

    if ((entry.flags & ENCRYPTION_BIT) !== 0) {
      this.sawEncrypted = true;
    }

    this.entries.set(key, entry);
    return true;
  }

  public has(entryPath: string): boolean {
    return this.entries.has(normalizeEntryPath(entryPath));
  }

  public get(entryPath: string): UnzipperEntry | undefined {
    return this.entries.get(normalizeEntryPath(entryPath));
  }

  public isEncrypted(entryPath: string): boolean {
    const entry = this.get(entryPath);
    return entry !== undefined && (entry.flags & ENCRYPTION_BIT) !== 0;
  }

  /** True when at least one entry in the pack carries the encryption bit. */
  public get requiresPassword(): boolean {
    return this.sawEncrypted;
  }

  public get rejectedPaths(): readonly string[] {
    return this.rejected;
  }

  public get size(): number {
    return this.entries.size;
  }

  public paths(): string[] {
    return [...this.entries.keys()];
  }
}
