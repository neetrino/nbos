import { createCipheriv, randomBytes } from 'crypto';
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, deriveKey, deriveLegacyKey, deriveV2Key } from './crypto';

const TEST_KEY = 'test-encryption-key-for-unit-tests';

function encryptLegacy(plaintext: string, masterKeyMaterial: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', deriveLegacyKey(masterKeyMaterial), iv, {
    authTagLength: 16,
  });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
}

describe('crypto', () => {
  describe('deriveLegacyKey', () => {
    it('should return a 32-byte buffer', () => {
      const key = deriveLegacyKey(TEST_KEY);
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it('should be deterministic', () => {
      const key1 = deriveLegacyKey(TEST_KEY);
      const key2 = deriveLegacyKey(TEST_KEY);
      expect(key1.equals(key2)).toBe(true);
    });

    it('should produce different keys for different inputs', () => {
      const key1 = deriveLegacyKey('key-a');
      const key2 = deriveLegacyKey('key-b');
      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe('deriveV2Key', () => {
    it('should return a 32-byte buffer', () => {
      const key = deriveV2Key(TEST_KEY);
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it('should differ from legacy derivation', () => {
      expect(deriveV2Key(TEST_KEY).equals(deriveLegacyKey(TEST_KEY))).toBe(false);
    });
  });

  describe('deriveKey alias', () => {
    it('should match deriveLegacyKey', () => {
      expect(deriveKey(TEST_KEY).equals(deriveLegacyKey(TEST_KEY))).toBe(true);
    });
  });

  describe('encrypt', () => {
    it('should return v2:iv:authTag:ciphertext format', () => {
      const result = encrypt('hello world', TEST_KEY);
      expect(result.startsWith('v2:')).toBe(true);
      expect(result.split(':').length).toBe(4);
    });

    it('should produce different ciphertexts for same input (random IV)', () => {
      const r1 = encrypt('same text', TEST_KEY);
      const r2 = encrypt('same text', TEST_KEY);
      expect(r1).not.toBe(r2);
    });
  });

  describe('decrypt v2', () => {
    it('should decrypt back to original plaintext', () => {
      const plain = 'super secret password 123!@#';
      const encrypted = encrypt(plain, TEST_KEY);
      expect(decrypt(encrypted, TEST_KEY)).toBe(plain);
    });

    it('should handle unicode strings', () => {
      const plain = 'Пароль: тест 🔐';
      const encrypted = encrypt(plain, TEST_KEY);
      expect(decrypt(encrypted, TEST_KEY)).toBe(plain);
    });

    it('should handle empty string', () => {
      const encrypted = encrypt('', TEST_KEY);
      expect(decrypt(encrypted, TEST_KEY)).toBe('');
    });

    it('should throw on wrong key', () => {
      const encrypted = encrypt('test', TEST_KEY);
      expect(() => decrypt(encrypted, 'wrong-key')).toThrow();
    });

    it('should throw on tampered ciphertext', () => {
      const encrypted = encrypt('test', TEST_KEY);
      const parts = encrypted.split(':');
      parts[3] = 'ff'.repeat(16);
      expect(() => decrypt(parts.join(':'), TEST_KEY)).toThrow();
    });
  });

  describe('decrypt legacy', () => {
    it('should decrypt legacy iv:authTag:ciphertext blobs', () => {
      const plain = 'legacy gmail refresh token blob';
      const legacy = encryptLegacy(plain, TEST_KEY);
      expect(legacy.startsWith('v2:')).toBe(false);
      expect(decrypt(legacy, TEST_KEY)).toBe(plain);
    });

    it('should throw on invalid legacy format', () => {
      expect(() => decrypt('invalid', TEST_KEY)).toThrow('Invalid encrypted format');
    });
  });
});
