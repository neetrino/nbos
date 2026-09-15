import { describe, expect, it } from 'vitest';
import {
  CATALOG_CATEGORY_CODES,
  CREDENTIAL_CATEGORY_CATALOG,
  credentialTypeForCategory,
  isCatalogCategory,
  resolveCredentialCategoryBackfill,
} from './credential-category-catalog';

describe('credential category catalog', () => {
  it('exposes ten UI categories without Other or Recovery', () => {
    expect(CATALOG_CATEGORY_CODES).toEqual([
      'ADMIN',
      'API_KEY',
      'DATABASE',
      'DOMAIN',
      'HOSTING',
      'SSH',
      'APP',
      'MAIL',
      'SERVICE',
      'ENV',
    ]);
    expect(CATALOG_CATEGORY_CODES).not.toContain('OTHER');
    expect(
      CREDENTIAL_CATEGORY_CATALOG.map((entry) => entry.credentialType as string),
    ).not.toContain('RECOVERY_CODES');
  });

  it('maps each catalog category to one credential type', () => {
    expect(credentialTypeForCategory('MAIL')).toBe('MAIL_SMTP');
    expect(credentialTypeForCategory('ENV')).toBe('ENV_BUNDLE');
    expect(credentialTypeForCategory('SSH')).toBe('SSH_PRIVATE_KEY');
    expect(credentialTypeForCategory('SERVICE')).toBe('LOGIN_PASSWORD');
    expect(credentialTypeForCategory('OTHER')).toBeNull();
    expect(isCatalogCategory('ENV')).toBe(true);
    expect(isCatalogCategory('OTHER')).toBe(false);
  });

  it('backfills ENV and SSH before leftover Other', () => {
    expect(
      resolveCredentialCategoryBackfill({ category: 'OTHER', credentialType: 'ENV_BUNDLE' }),
    ).toBe('ENV');
    expect(
      resolveCredentialCategoryBackfill({
        category: 'OTHER',
        credentialType: 'SSH_PRIVATE_KEY',
      }),
    ).toBe('SSH');
    expect(
      resolveCredentialCategoryBackfill({ category: 'OTHER', credentialType: 'LOGIN_PASSWORD' }),
    ).toBe('SERVICE');
    expect(
      resolveCredentialCategoryBackfill({ category: 'MAIL', credentialType: 'LOGIN_PASSWORD' }),
    ).toBe('MAIL');
  });
});
