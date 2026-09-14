import { describe, expect, it } from 'vitest';
import {
  parseVaultUnlockEntry,
  serializeVaultUnlockEntry,
} from './credential-vault-session.constants';

describe('vault unlock entry serialization', () => {
  it('round-trips expiry and authVersion', () => {
    const entry = { expiresAtMs: 1_760_000_000_000, authVersion: 7 };
    expect(parseVaultUnlockEntry(serializeVaultUnlockEntry(entry))).toEqual(entry);
  });

  it('rejects pre-authVersion records so the employee unlocks once more', () => {
    expect(parseVaultUnlockEntry('1760000000000')).toBeNull();
  });

  it('rejects malformed or incomplete records', () => {
    expect(parseVaultUnlockEntry('not json')).toBeNull();
    expect(parseVaultUnlockEntry('{"expiresAtMs":1760000000000}')).toBeNull();
    expect(parseVaultUnlockEntry('{"authVersion":3}')).toBeNull();
    expect(parseVaultUnlockEntry('null')).toBeNull();
  });
});
