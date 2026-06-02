import { encrypt, decrypt } from '../../common/utils/crypto';
import { type SensitiveField, SENSITIVE_FIELDS } from './credential-domain.types';

export function encryptSensitiveFields(
  data: Partial<Record<SensitiveField, string | undefined | null>>,
  encryptionKey: string,
): Record<string, string | undefined | null> {
  const result: Record<string, string | undefined | null> = {};
  for (const field of SENSITIVE_FIELDS) {
    const value = data[field];
    result[field] = value ? encrypt(value, encryptionKey) : value;
  }
  return result;
}

export function decryptFieldIfEncrypted(stored: string, encryptionKey: string): string {
  if (typeof stored === 'string' && stored.includes(':')) {
    return decrypt(stored, encryptionKey);
  }
  return stored;
}
