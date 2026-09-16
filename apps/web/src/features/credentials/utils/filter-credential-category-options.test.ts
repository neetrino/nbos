import { describe, expect, it } from 'vitest';
import { filterAndRankCredentialCategoryOptions } from './filter-credential-category-options';
import type { CredentialCategoryOption } from '@/features/credentials/constants/credential-vault-categories';

const OPTIONS: CredentialCategoryOption[] = [
  { value: 'API_KEY', label: 'API Key' },
  { value: 'DATABASE', label: 'Database' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'ENV', label: 'ENV' },
];

describe('filterAndRankCredentialCategoryOptions', () => {
  it('keeps catalog order when the query is empty', () => {
    expect(filterAndRankCredentialCategoryOptions(OPTIONS, '  ').map((row) => row.value)).toEqual([
      'API_KEY',
      'DATABASE',
      'SERVICE',
      'ENV',
    ]);
  });

  it('puts prefix matches first, then other contains hits in catalog order', () => {
    expect(filterAndRankCredentialCategoryOptions(OPTIONS, 'e').map((row) => row.value)).toEqual([
      'ENV',
      'API_KEY',
      'DATABASE',
      'SERVICE',
    ]);
  });

  it('ranks a word prefix above a later substring', () => {
    const options: CredentialCategoryOption[] = [...OPTIONS, { value: 'MASK', label: 'Mask' }];
    expect(filterAndRankCredentialCategoryOptions(options, 'k').map((row) => row.value)).toEqual([
      'API_KEY',
      'MASK',
    ]);
  });
});
