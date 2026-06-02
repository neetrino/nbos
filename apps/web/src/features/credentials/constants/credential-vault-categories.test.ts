import { describe, expect, it } from 'vitest';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import {
  categoriesForVaultScope,
  categoryBoardColumnsForQuickFilter,
  filterCredentialsByQuickCategory,
  quickCategoryChipsForVaultScope,
} from './credential-vault-categories';

describe('credential-vault-categories', () => {
  it('limits My scope to MAIL, SERVICE, APP, OTHER', () => {
    const values = categoriesForVaultScope('my').map((c) => c.value);
    expect(values).toEqual(['MAIL', 'SERVICE', 'APP', 'OTHER']);
    expect(values).not.toContain('ADMIN');
  });

  it('allows full enum on All scope', () => {
    expect(categoriesForVaultScope('all').length).toBe(9);
  });

  it('includes legacy category on edit when outside scope', () => {
    const options = categoriesForVaultScope('my', 'ADMIN');
    expect(options.map((c) => c.value)).toContain('ADMIN');
  });

  it('excludes out-of-scope categories without legacy extra', () => {
    expect(categoriesForVaultScope('secret').map((c) => c.value)).toContain('ADMIN');
    expect(categoriesForVaultScope('my').map((c) => c.value)).not.toContain('ADMIN');
  });

  it('returns all board columns when no quick category filter is active', () => {
    const chips = quickCategoryChipsForVaultScope('project');
    expect(categoryBoardColumnsForQuickFilter(chips, null)).toEqual(chips);
  });

  it('returns only the active quick-filter column on the category board', () => {
    const chips = quickCategoryChipsForVaultScope('project');
    expect(categoryBoardColumnsForQuickFilter(chips, 'DATABASE')).toEqual([
      { value: 'DATABASE', label: 'Database' },
    ]);
  });

  it('filters loaded credentials client-side for the category board', () => {
    const chips = quickCategoryChipsForVaultScope('project');
    const credentials = [
      { id: '1', category: 'DATABASE' },
      { id: '2', category: 'HOSTING' },
      { id: '3', category: 'UNKNOWN' },
    ] as CredentialListItem[];

    expect(filterCredentialsByQuickCategory(credentials, 'DATABASE', chips)).toEqual([
      credentials[0],
    ]);
    expect(filterCredentialsByQuickCategory(credentials, 'OTHER', chips)).toEqual([credentials[2]]);
    expect(filterCredentialsByQuickCategory(credentials, null, chips)).toEqual(credentials);
  });
});
