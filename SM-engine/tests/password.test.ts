import { describe, it, expect } from 'vitest';
import { deriveVerifier, createEncryptionMetadata, verifyPasswordAgainst } from '../src/main/content/password';
import { randomBytes } from 'crypto';

describe('password - verifier derivation', () => {
  it('is deterministic for the same password, salt and iterations', () => {
    const salt = randomBytes(16);
    expect(deriveVerifier('hunter2', salt, 1000).equals(deriveVerifier('hunter2', salt, 1000))).toBe(true);
  });

  it('differs for a different password', () => {
    const salt = randomBytes(16);
    expect(deriveVerifier('hunter2', salt, 1000).equals(deriveVerifier('hunter3', salt, 1000))).toBe(false);
  });

  it('differs for a different salt', () => {
    expect(deriveVerifier('hunter2', randomBytes(16), 1000)
      .equals(deriveVerifier('hunter2', randomBytes(16), 1000))).toBe(false);
  });

  it('produces a 32 byte verifier', () => {
    expect(deriveVerifier('hunter2', randomBytes(16), 1000)).toHaveLength(32);
  });
});

describe('password - Metadata Encryption block', () => {
  it('round-trips the correct password', () => {
    const encryption = createEncryptionMetadata('correct horse');
    expect(verifyPasswordAgainst('correct horse', encryption)).toBe(true);
  });

  it('rejects an incorrect password', () => {
    const encryption = createEncryptionMetadata('correct horse');
    expect(verifyPasswordAgainst('battery staple', encryption)).toBe(false);
  });

  it('never stores the password in the block', () => {
    const password = 'correct horse';
    const encryption = createEncryptionMetadata(password);
    const serialized = JSON.stringify(encryption);
    expect(serialized).not.toContain(password);
    expect(Object.values(encryption)).not.toContain(password);
  });

  it('emits the fields the pack standard defines', () => {
    const encryption = createEncryptionMetadata('x', 1000);
    expect(encryption.Algorithm).toBe('ZipCrypto');
    expect(encryption.Kdf).toBe('pbkdf2-sha256');
    expect(encryption.Iterations).toBe(1000);
    expect(Buffer.from(encryption.Salt, 'base64')).toHaveLength(16);
    expect(Buffer.from(encryption.Verifier, 'base64')).toHaveLength(32);
  });

  it('uses a fresh salt per call, so identical passwords differ', () => {
    expect(createEncryptionMetadata('same').Salt).not.toBe(createEncryptionMetadata('same').Salt);
  });
});

describe('password - verification edge cases', () => {
  it('accepts anything when the pack declares no encryption', () => {
    expect(verifyPasswordAgainst('', undefined)).toBe(true);
    expect(verifyPasswordAgainst('anything', undefined)).toBe(true);
  });

  it('rejects a block with an empty salt or verifier rather than throwing', () => {
    const base = createEncryptionMetadata('x');
    expect(verifyPasswordAgainst('x', { ...base, Salt: '' })).toBe(false);
    expect(verifyPasswordAgainst('x', { ...base, Verifier: '' })).toBe(false);
  });

  it('rejects a verifier of the wrong length without throwing', () => {
    const base = createEncryptionMetadata('x');
    const truncated = { ...base, Verifier: Buffer.from([1, 2, 3]).toString('base64') };
    expect(verifyPasswordAgainst('x', truncated)).toBe(false);
  });

  it('rejects a non-base64 verifier without throwing', () => {
    const base = createEncryptionMetadata('x');
    expect(verifyPasswordAgainst('x', { ...base, Verifier: '!!!not base64!!!' })).toBe(false);
  });
});
