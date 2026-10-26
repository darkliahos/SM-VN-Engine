import { Readable } from 'stream';
import { Open, UnzipperDirectory, UnzipperEntry } from 'unzipper';
import { METADATA_FILE } from '../../services/GamePaths';
import {
  isPackFormatSupported,
  Metadata,
  packFormatMajor,
  SUPPORTED_PACK_FORMAT_VERSION,
} from '../../models/Metadata';
import { PackIndex } from './PackIndex';
import {
  BadPasswordError,
  EntryNotFoundError,
  GameSource,
  PasswordRequiredError,
  streamToBuffer,
  translateStreamError,
} from './GameSource';
import { verifyPasswordAgainst } from './password';
import { decodeKeyFile, keyPathForPack } from './cipher';

/**
 * A game's content read out of a `.fap` pack.
 *
 * `open()` enumerates the central directory without a password — ZipCrypto
 * encrypts entry data only, never the directory — so the engine can tell an
 * encrypted pack from a plaintext one and prompt before any read is attempted.
 */
export class PackSource implements GameSource {
  public readonly kind = 'pack' as const;

  private directory: UnzipperDirectory | null = null;
  private index = new PackIndex();
  private password: string | undefined;
  private opened = false;

  constructor(public readonly packPath: string) {}

  public get description(): string {
    return this.packPath;
  }

  public get entryCount(): number {
    return this.index.size;
  }

  public get requiresPassword(): boolean {
    return this.index.requiresPassword;
  }

  public get isUnlocked(): boolean {
    return !this.requiresPassword || this.password !== undefined;
  }

  public async open(): Promise<void> {
    this.directory = await Open.file(this.packPath);
    this.index = new PackIndex();

    for (const entry of this.directory.files) {
      this.index.add(entry.path, entry);
    }

    if (this.index.rejectedPaths.length > 0) {
      console.warn(
        `Rejected ${this.index.rejectedPaths.length} unsafe pack entries: ${this.index.rejectedPaths.join(', ')}`
      );
    }

    if (!this.index.has(METADATA_FILE)) {
      throw new Error(`Pack is missing ${METADATA_FILE}: ${this.packPath}`);
    }
    if (this.index.isEncrypted(METADATA_FILE)) {
      // Metadata must be readable before a password can be requested, so an
      // encrypted Metadata.json is unsatisfiable rather than merely awkward.
      throw new Error(
        `${METADATA_FILE} must not be encrypted: the engine must read it before it can ask for a password`
      );
    }

    // The index is fully populated, so reads are safe from here on. Version
    // validation goes through readMetadata, which asserts the source is open.
    this.opened = true;
    try {
      await this.validateFormatVersion();
      await this.loadPasswordFromMetadata();
    } catch (err) {
      this.opened = false;
      throw err;
    }
  }

  /**
   * Resolves the pack password using the following priority:
   *
   * 1. If a `game.key` (or `<packName>.key`) file exists next to the pack,
   *    decrypt it with the engine's AES-256-GCM cipher and verify the
   *    recovered password against the PBKDF2 verifier in Metadata.json.
   *
   * 2. (Legacy / fallback) If `Metadata.Password` is set, use it directly.
   *    This path is deprecated and will be removed in a future version.
   *
   * If neither source yields a valid password and the pack requires one, the
   * caller must show an error dialog and abort.
   */
  private async loadPasswordFromMetadata(): Promise<void> {
    const metadata = await this.readMetadata();

    // --- Approach 3: AES-encrypted game.key (preferred) ---
    const keyPath = keyPathForPack(this.packPath);
    let keyPassword: string | null = null;
    try {
      keyPassword = await decodeKeyFile(keyPath);
    } catch {
      // key file absent or malformed — fall through to legacy path
    }

    if (keyPassword !== null) {
      const ok = await this.verifyPassword(keyPassword);
      if (!ok) {
        throw new BadPasswordError(
          `game.key was decoded successfully but the password did not match ` +
          `the PBKDF2 verifier in Metadata.json. The key file may be for a ` +
          `different version of this pack.`
        );
      }
      return;
    }

    // --- Legacy: plaintext password in Metadata.json ---
    const metadataPassword = metadata.Password ?? (metadata as any).password;
    if (metadataPassword) {
      // Warn, but honour the legacy field so existing packs keep working.
      console.warn(
        '[PackSource] Warning: pack is using a deprecated plaintext Password field in ' +
        'Metadata.json. Re-pack with `sm-cli pack --password=<pwd>` to switch to game.key.'
      );
      await this.verifyPassword(metadataPassword);
    }
  }

  private async validateFormatVersion(): Promise<void> {
    const metadata = await this.readMetadata();
    if (!isPackFormatSupported(metadata)) {
      throw new Error(
        `Pack format version ${packFormatMajor(metadata.PackFormatVersion)} is newer than the supported ` +
          `version ${SUPPORTED_PACK_FORMAT_VERSION}: ${this.packPath}`
      );
    }
  }

  public exists(entryPath: string): boolean {
    return this.index.has(entryPath);
  }

  public size(entryPath: string): number | null {
    return this.index.get(entryPath)?.uncompressedSize ?? null;
  }

  public async readStream(entryPath: string): Promise<Readable> {
    this.assertOpen();
    const entry = this.requireEntry(entryPath);

    if (this.index.isEncrypted(entryPath) && this.password === undefined) {
      // Fail before the response starts so the protocol handler can return a
      // real status code instead of a stream that dies mid-body.
      throw new PasswordRequiredError(entryPath);
    }

    try {
      return entry.stream(this.password);
    } catch (error) {
      throw translateStreamError(error, entryPath);
    }
  }

  public async readBuffer(entryPath: string): Promise<Buffer> {
    const stream = await this.readStream(entryPath);
    try {
      return await streamToBuffer(stream);
    } catch (error) {
      throw translateStreamError(error, entryPath);
    }
  }

  public async readText(entryPath: string): Promise<string> {
    return (await this.readBuffer(entryPath)).toString('utf-8');
  }

  public async readMetadata(): Promise<Metadata> {
    return JSON.parse(await this.readText(METADATA_FILE)) as Metadata;
  }

  public async verifyPassword(password: string): Promise<boolean> {
    this.assertOpen();
    const metadata = await this.readMetadata();
    if (!verifyPasswordAgainst(password, metadata.Encryption)) {
      return false;
    }
    this.password = password;
    return true;
  }

  public async close(): Promise<void> {
    this.password = undefined;
    this.opened = false;
    this.directory = null;
    this.index = new PackIndex();
  }

  private assertOpen(): void {
    if (!this.opened || this.directory === null) {
      throw new Error(`Pack source is not open: ${this.packPath}`);
    }
  }

  private requireEntry(entryPath: string): UnzipperEntry {
    const entry = this.index.get(entryPath);
    if (!entry) {
      throw new EntryNotFoundError(entryPath);
    }
    return entry;
  }
}
