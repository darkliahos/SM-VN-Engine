import { createDecipheriv } from 'crypto';
import { promises as fsp } from 'fs';

/**
 * AES-256-GCM cipher module for SM-engine.
 *
 * Decodes a game.key file that was produced by SM-cli's cipher.ts encoder.
 * The master key is intentionally identical to the one in SM-cli — both sides
 * of the codec must use the same secret.
 *
 * Binary layout of game.key:
 *   [IV (12 bytes)] [AuthTag (16 bytes)] [CipherText (variable)]
 */

/** Shared 256-bit master key — must mirror SM-cli/src/cipher.ts exactly. */
const MASTER_KEY = Buffer.from(
  'SM-VN-Engine::KeyFile::AES256GCM::MasterSecret::v1',
  'utf8'
).subarray(0, 32);

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Decrypts a raw game.key Buffer back to the plaintext password string.
 * Throws if the buffer is malformed or has been tampered with (GCM auth failure).
 */
export function decodeKeyBuffer(payload: Buffer): string {
  if (payload.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error('game.key is too short to be a valid key file');
  }

  const iv = payload.subarray(0, IV_LENGTH);
  const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const cipherText = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(cipherText), decipher.final()]).toString('utf8');
}

/**
 * Reads and decrypts a game.key file from disk.
 * Returns the plaintext password string.
 * Throws on I/O errors, malformed payload, or tampered auth tag.
 */
export async function decodeKeyFile(keyPath: string): Promise<string> {
  const payload = await fsp.readFile(keyPath);
  return decodeKeyBuffer(payload);
}

/**
 * Returns the conventional .key path for a given pack path.
 * e.g.  /path/to/game.fap  →  /path/to/game.key
 */
export function keyPathForPack(packPath: string): string {
  return packPath.replace(/\.fap$/i, '.key');
}
