import { describe, expect, it } from 'vitest';
import { clientServiceDetailInclude, clientServiceListInclude } from './client-services.helpers';

const CREDENTIAL_SECRET_KEYS = [
  'login',
  'password',
  'passphrase',
  'apiKey',
  'envData',
  'secureNotes',
] as const;

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (!value || typeof value !== 'object') return keys;
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  for (const [key, nested] of Object.entries(value)) {
    keys.add(key);
    collectKeys(nested, keys);
  }
  return keys;
}

describe('client-service credential select', () => {
  it('omits vault secrets from list and detail includes', () => {
    const keys = collectKeys({
      list: clientServiceListInclude,
      detail: clientServiceDetailInclude,
    });

    expect(keys.has('providerAccount')).toBe(true);
    for (const secret of CREDENTIAL_SECRET_KEYS) {
      expect(keys.has(secret), `leaked ${secret}`).toBe(false);
    }
  });

  it('keeps only non-secret credential identity on the provider account', () => {
    expect(clientServiceListInclude.providerAccount.select).toEqual({
      id: true,
      name: true,
      provider: { select: { id: true, name: true, slug: true, website: true } },
    });
  });
});
