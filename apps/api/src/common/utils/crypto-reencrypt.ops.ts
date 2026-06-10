import { decrypt, encrypt } from './crypto';

const V2_FORMAT_PREFIX = 'v2';

export function isV2Ciphertext(value: string): boolean {
  return value.startsWith(`${V2_FORMAT_PREFIX}:`);
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
  const plaintext = decrypt(ciphertext, masterKeyMaterial);
  return { value: encrypt(plaintext, masterKeyMaterial), migrated: true };
}
