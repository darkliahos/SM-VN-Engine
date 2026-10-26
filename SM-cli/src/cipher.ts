import * as crypto from 'crypto';

/**
 * AES-256-GCM cipher module for SM-cli.
 *
 * The engine master secret is a deterministic, hard-coded 256-bit key that is
 * shared between SM-cli (encoding) and SM-engine (decoding). Its purpose is to
 * make the key file unreadable in a plain text editor — it is NOT a
 * cryptographic secret: anyone with the SM-engine binary can derive it. True
 * security of a pack rests on the PBKDF2 verifier in Metadata.json and on not
 * distributing game.key to end-users.
 *
 * Binary layout of game.key:
 *   [IV (12 bytes)] [AuthTag (16 bytes)] [CipherText (variable)]
 */

/** Shared 256-bit master key (32 bytes). */
const MASTER_KEY = Buffer.from(
  'SM-VN-Engine::KeyFile::AES256GCM::MasterSecret::v1',
  'utf8'
).subarray(0, 32);

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a plaintext password and returns the binary payload written to
 * game.key.  A fresh random IV is used on every call so two runs with the same
 * password produce different output.
 */
export function encodeKeyFile(password: string): Buffer {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(password, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypts a game.key binary payload back to the plaintext password.
 * Throws if the payload is malformed or has been tampered with.
 */
export function decodeKeyFile(payload: Buffer): string {
  if (payload.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error('game.key payload is too short to be valid');
  }

  const iv = payload.subarray(0, IV_LENGTH);
  const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const cipherText = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(cipherText), decipher.final()]).toString('utf8');
}
