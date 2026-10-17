import { Readable } from 'stream';
import { Metadata } from '../../models/Metadata';

/**
 * A read-only view over a game's content, backed either by a `.fap` pack or by
 * loose folders on disk. Both forms expose the same canonical layout, so
 * callers never need to know which one is active.
 */
export interface GameSource {
  readonly kind: 'pack' | 'folder';
  readonly requiresPassword: boolean;
  readonly isUnlocked: boolean;
  readonly description: string;

  /** Number of content entries in the source. Packs return their index size. */
  readonly entryCount: number;

  open(): Promise<void>;
  exists(entryPath: string): boolean;
  /** Uncompressed size in bytes, or null if the entry is not present. */
  size(entryPath: string): number | null;
  readStream(entryPath: string): Promise<Readable>;
  readBuffer(entryPath: string): Promise<Buffer>;
  readText(entryPath: string): Promise<string>;
  readMetadata(): Promise<Metadata>;

  /**
   * Checks a password against the pack's stored verifier. Folder sources have
   * no encryption, so they reject rather than quietly accepting a password the
   * caller may believe is protecting the content.
   */
  verifyPassword(password: string): Promise<boolean>;

  close(): Promise<void>;
}

export class EntryNotFoundError extends Error {
  constructor(entryPath: string) {
    super(`Game content entry not found: ${entryPath}`);
    this.name = 'EntryNotFoundError';
  }
}

export class PasswordRequiredError extends Error {
  constructor(entryPath: string) {
    super(`Entry is encrypted and no password has been supplied: ${entryPath}`);
    this.name = 'PasswordRequiredError';
  }
}

export class BadPasswordError extends Error {
  constructor(entryPath: string) {
    super(`Incorrect password while reading entry: ${entryPath}`);
    this.name = 'BadPasswordError';
  }
}

/** Collects a readable stream into a Buffer, rejecting if the stream errors. */
export function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer | string) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    });
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

/** Maps unzipper's password failures onto our own error types. */
export function translateStreamError(error: unknown, entryPath: string): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('MISSING_PASSWORD')) {
    return new PasswordRequiredError(entryPath);
  }
  if (message.includes('BAD_PASSWORD')) {
    return new BadPasswordError(entryPath);
  }
  return error instanceof Error ? error : new Error(String(error));
}
