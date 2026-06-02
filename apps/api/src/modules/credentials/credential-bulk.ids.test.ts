import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { normalizeBulkCredentialIds } from './credential-bulk.ids';

describe('normalizeBulkCredentialIds', () => {
  it('dedupes and trims ids', () => {
    expect(normalizeBulkCredentialIds([' a ', 'a', 'b'])).toEqual(['a', 'b']);
  });

  it('rejects empty arrays', () => {
    expect(() => normalizeBulkCredentialIds([])).toThrow(BadRequestException);
  });

  it('rejects batches over the limit', () => {
    const ids = Array.from({ length: 51 }, (_, i) => `id-${i}`);
    expect(() => normalizeBulkCredentialIds(ids)).toThrow(BadRequestException);
  });
});
