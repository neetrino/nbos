import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, deriveKey } from './crypto';

const TEST_KEY = 'test-encryption-key-for-unit-tests';

describe('crypto', () => {
  describe('deriveKey', () => {
    it('should return a 32-byte buffer', () => {
      const key = deriveKey(TEST_KEY);
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it('should be deterministic', () => {
      const key1 = deriveKey(TEST_KEY);
      const key2 = deriveKey(TEST_KEY);
      expect(key1.equals(key2)).toBe(true);
    });

    it('should produce different keys for different inputs', () => {
      const key1 = deriveKey('key-a');
      const key2 = deriveKey('key-b');
      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe('encrypt', () => {
    it('should return iv:authTag:ciphertext format', () => {
      const result = encrypt('hello world', TEST_KEY);
      const parts = result.split(':');
      expect(parts.length).toBe(3);
    });

    it('should produce different ciphertexts for same input (random IV)', () => {
      const r1 = encrypt('same text', TEST_KEY);
      const r2 = encrypt('same text', TEST_KEY);
      expect(r1).not.toBe(r2);
    });
  });

  describe('decrypt', () => {
    it('should decrypt back to original plaintext', () => {
      const plain = 'super secret password 123!@#';
      const encrypted = encrypt(plain, TEST_KEY);
      const decrypted = decrypt(encrypted, TEST_KEY);
      expect(decrypted).toBe(plain);
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

    it('should throw on invalid format', () => {
      expect(() => decrypt('invalid', TEST_KEY)).toThrow('Invalid encrypted format');
    });

    it('should throw on wrong key', () => {
      const encrypted = encrypt('test', TEST_KEY);
      expect(() => decrypt(encrypted, 'wrong-key')).toThrow();
    });

    it('should throw on tampered ciphertext', () => {
      const encrypted = encrypt('test', TEST_KEY);
      const parts = encrypted.split(':');
      parts[2] = 'ff'.repeat(16);
      expect(() => decrypt(parts.join(':'), TEST_KEY)).toThrow();
    });
  });
});
