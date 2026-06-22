import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, deriveV2Key } from './crypto';

const TEST_KEY = 'test-encryption-key-for-unit-tests';

describe('crypto', () => {
  describe('deriveV2Key', () => {
    it('should return a 32-byte buffer', () => {
      const key = deriveV2Key(TEST_KEY);
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it('should be deterministic', () => {
      expect(deriveV2Key(TEST_KEY).equals(deriveV2Key(TEST_KEY))).toBe(true);
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

    it('should reject legacy unversioned ciphertext', () => {
      expect(() => decrypt('aa:bb:cc', TEST_KEY)).toThrow(
        'Invalid encrypted format: expected v2:iv:authTag:ciphertext',
      );
    });
  });
});
