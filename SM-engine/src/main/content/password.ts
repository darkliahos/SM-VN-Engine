import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';
import type { EncryptionMetadata } from '../../models/Metadata';

const VERIFIER_BYTES = 32;
const DEFAULT_ITERATIONS = 100000;

/**
 * Derives the verifier stored in Metadata.json.
 *
 * The password itself is never persisted. Metadata.json holds only this value,
 * which gates access but cannot be reversed back into the password.
 */
export function deriveVerifier(password: string, salt: Buffer, iterations: number): Buffer {
  return pbkdf2Sync(password, salt, iterations, VERIFIER_BYTES, 'sha256');
}

export function createEncryptionMetadata(password: string, iterations = DEFAULT_ITERATIONS): EncryptionMetadata {
  const salt = randomBytes(16);
  return {
    Algorithm: 'ZipCrypto',
    Kdf: 'pbkdf2-sha256',
    Iterations: iterations,
    Salt: salt.toString('base64'),
    Verifier: deriveVerifier(password, salt, iterations).toString('base64'),
  };
}

/**
 * Constant-time comparison of a candidate password against the stored verifier.
 * A pack with no Encryption block accepts any password, since there is nothing
 * to verify against.
 */
export function verifyPasswordAgainst(password: string, encryption: EncryptionMetadata | undefined): boolean {
  if (!encryption) {
    return true;
  }

  const iterations = encryption.Iterations || DEFAULT_ITERATIONS;
  let expected: Buffer;
  try {
    expected = Buffer.from(encryption.Verifier, 'base64');
    const salt = Buffer.from(encryption.Salt, 'base64');
    if (expected.length === 0 || salt.length === 0) {
      return false;
    }
    const actual = deriveVerifier(password, salt, iterations);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
