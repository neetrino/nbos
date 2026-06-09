import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const V2_FORMAT_PREFIX = 'v2';
const V2_KEY_SALT = 'NBOS_CREDENTIALS_ENCRYPTION_V2';
const SCRYPT_KEY_LENGTH = 32;
const SCRYPT_DERIVATION_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/**
 * Legacy decrypt-only AES key derivation for pre-v2 `iv:authTag:ciphertext` blobs.
 * Not used for user password hashing; new encryptions use {@link deriveV2Key} (scrypt).
 * Removal requires re-encrypting existing Credential and MailProviderSecret rows.
 */
export function deriveLegacyKey(masterKeyMaterial: string): Buffer {
  // codeql[js/insufficient-password-hash]: Legacy AES key derivation for decrypting pre-v2 ciphertext only; not password hashing. New encryption uses v2 scrypt via deriveV2Key. Removing this requires a DB re-encryption migration.
  return createHash('sha256').update(masterKeyMaterial).digest();
}

/** scrypt-based key derivation for v2 encryptions (not used for password hashing). */
export function deriveV2Key(masterKeyMaterial: string): Buffer {
  return scryptSync(masterKeyMaterial, V2_KEY_SALT, SCRYPT_KEY_LENGTH, SCRYPT_DERIVATION_OPTIONS);
}

function encryptWithDerivedKey(plaintext: string, derivedKey: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, derivedKey, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptWithDerivedKey(payload: string, derivedKey: Buffer): string {
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format: expected iv:authTag:ciphertext');
  }
  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex!, 'hex');
  const authTag = Buffer.from(authTagHex!, 'hex');
  const ciphertext = Buffer.from(ciphertextHex!, 'hex');
  const decipher = createDecipheriv(ALGORITHM, derivedKey, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/**
 * Encrypts plaintext using AES-256-GCM with v2 scrypt key derivation.
 * @returns `v2:iv:authTag:ciphertext` (hex-encoded body)
 */
export function encrypt(plaintext: string, masterKeyMaterial: string): string {
  const body = encryptWithDerivedKey(plaintext, deriveV2Key(masterKeyMaterial));
  return `${V2_FORMAT_PREFIX}:${body}`;
}

/**
 * Decrypts v2 `v2:iv:authTag:ciphertext` blobs (preferred) or legacy unversioned
 * `iv:authTag:ciphertext` blobs written before v2 scrypt key derivation.
 */
export function decrypt(encrypted: string, masterKeyMaterial: string): string {
  if (encrypted.startsWith(`${V2_FORMAT_PREFIX}:`)) {
    const payload = encrypted.slice(V2_FORMAT_PREFIX.length + 1);
    return decryptWithDerivedKey(payload, deriveV2Key(masterKeyMaterial));
  }
  return decryptWithDerivedKey(encrypted, deriveLegacyKey(masterKeyMaterial));
}

/**
 * Constant-time string comparison (avoids timing side-channels when comparing
 * secrets such as API keys). Returns false for empty inputs.
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
