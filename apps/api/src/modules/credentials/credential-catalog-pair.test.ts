import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  applyCatalogTypeOnCategoryChange,
  requireCatalogCredentialPair,
} from './credential-catalog-pair';

describe('credential catalog pair', () => {
  it('rejects missing or legacy categories on create', () => {
    expect(() => requireCatalogCredentialPair(undefined)).toThrow(BadRequestException);
    expect(() => requireCatalogCredentialPair(undefined)).toThrow('Category is required');
    expect(() => requireCatalogCredentialPair('')).toThrow('Category is required');
    expect(() => requireCatalogCredentialPair('OTHER')).toThrow('Invalid category');
    expect(requireCatalogCredentialPair('MAIL')).toEqual({
      category: 'MAIL',
      credentialType: 'MAIL_SMTP',
    });
  });

  it('derives type only when category changes', () => {
    expect(
      applyCatalogTypeOnCategoryChange('MAIL', {
        category: 'MAIL',
        credentialType: 'ENV_BUNDLE',
        name: 'Keep',
      }),
    ).toEqual({ category: 'MAIL', name: 'Keep' });
    expect(applyCatalogTypeOnCategoryChange('SERVICE', { category: 'ENV' })).toEqual({
      category: 'ENV',
      credentialType: 'ENV_BUNDLE',
    });
  });
});
