import { encrypt, decrypt } from '../../../common/utils/crypto';
import { DOMAIN_REGISTRANT_DATA_MAX_LENGTH } from '@nbos/shared';

const EMPTY = '';

export function assertRegistrantDataLength(value: string): void {
  if (value.length > DOMAIN_REGISTRANT_DATA_MAX_LENGTH) {
    throw new Error('Registrant data exceeds the allowed length');
  }
}

/** Encrypts the free-text registration block. Never log `plaintext`. */
export function encryptRegistrantData(plaintext: string, masterKey: string): string {
  const trimmed = plaintext.trim();
  assertRegistrantDataLength(trimmed);
  return encrypt(trimmed, masterKey);
}

export function decryptRegistrantData(ciphertext: string, masterKey: string): string {
  if (!ciphertext.trim()) return EMPTY;
  return decrypt(ciphertext, masterKey);
}
