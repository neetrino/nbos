import { describe, expect, it } from 'vitest';
import { findPersistedSecretFields, findRawTokenFields } from './ai-admin-secrets';

describe('ai-admin secret scanners', () => {
  it('flags persisted provider and credential secret fields', () => {
    expect(
      findPersistedSecretFields({
        keyPrefix: 'sk-ab',
        nested: { apiKey: 'secret', encryptedApiKey: 'cipher' },
      }),
    ).toEqual(['$.nested.apiKey', '$.nested.encryptedApiKey']);
  });

  it('flags a raw token field used after the one-time modal', () => {
    expect(findRawTokenFields({ credential: { tokenPrefix: 'nbos_agt' }, token: 'raw' })).toEqual([
      '$.token',
    ]);
  });
});
