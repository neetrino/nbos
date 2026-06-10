import { createCipheriv, createDecipheriv, createHash } from 'crypto';
import { decrypt, encrypt } from './crypto';

const V2_FORMAT_PREFIX = 'v2';
const ALGORITHM = 'aes-256-gcm';
const AUTH_TAG_LENGTH = 16;

export function isV2Ciphertext(value: string): boolean {
  return value.startsWith(`${V2_FORMAT_PREFIX}:`);
}

/** Migration-only: decrypt pre-v2 `iv:authTag:ciphertext` blobs (SHA-256 KDF). */
function decryptLegacyCiphertext(ciphertext: string, masterKeyMaterial: string): string {
  const legacyKey = createHash('sha256').update(masterKeyMaterial).digest();
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid legacy encrypted format: expected iv:authTag:ciphertext');
  }
  const [ivHex, authTagHex, payloadHex] = parts;
  const iv = Buffer.from(ivHex!, 'hex');
  const authTag = Buffer.from(authTagHex!, 'hex');
  const payload = Buffer.from(payloadHex!, 'hex');
  const decipher = createDecipheriv(ALGORITHM, legacyKey, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(payload), decipher.final()]).toString('utf8');
}

/**
 * Re-encrypts legacy `iv:authTag:ciphertext` blobs to `v2:…` scrypt format.
 * Returns the original value when already v2.
 */
export function reencryptCiphertextToV2(
  ciphertext: string,
  masterKeyMaterial: string,
): { value: string; migrated: boolean } {
  if (isV2Ciphertext(ciphertext)) {
    return { value: ciphertext, migrated: false };
  }
  const plaintext = decryptLegacyCiphertext(ciphertext, masterKeyMaterial);
  return { value: encrypt(plaintext, masterKeyMaterial), migrated: true };
}

/** Test helper: builds a legacy ciphertext blob for migration tests. */
export function encryptLegacyCiphertextForTest(
  plaintext: string,
  masterKeyMaterial: string,
): string {
  const legacyKey = createHash('sha256').update(masterKeyMaterial).digest();
  const iv = Buffer.alloc(16, 1);
  const cipher = createCipheriv(ALGORITHM, legacyKey, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
}
