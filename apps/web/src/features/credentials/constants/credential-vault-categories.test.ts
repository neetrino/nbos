import { describe, expect, it } from 'vitest';
import { CATALOG_CATEGORY_CODES } from '@nbos/shared';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import {
  categoriesForVaultScope,
  categoryBoardColumnsForQuickFilter,
  filterCredentialsByQuickCategory,
  presetCategoryForCreate,
  quickCategoryChipsForVaultScope,
} from './credential-vault-categories';

describe('credential-vault-categories', () => {
  it('limits My scope to Mail, Service, App, ENV, SSH', () => {
    const values = categoriesForVaultScope('my').map((c) => c.value);
    expect(values).toEqual(['MAIL', 'SERVICE', 'APP', 'ENV', 'SSH']);
    expect(values).not.toContain('ADMIN');
    expect(values).not.toContain('OTHER');
  });

  it('limits Company scope to the same low-risk set as Team', () => {
    expect(categoriesForVaultScope('company').map((c) => c.value)).toEqual(
      categoriesForVaultScope('team').map((c) => c.value),
    );
  });

  it('allows the catalog on All and Project scopes', () => {
    expect(categoriesForVaultScope('all').map((c) => c.value)).toEqual([...CATALOG_CATEGORY_CODES]);
    expect(categoriesForVaultScope('project').map((c) => c.value)).toEqual([
      ...CATALOG_CATEGORY_CODES,
    ]);
  });

  it('includes legacy category on edit when outside scope', () => {
    const options = categoriesForVaultScope('my', 'ADMIN');
    expect(options.map((c) => c.value)).toContain('ADMIN');
  });

  it('does not add leftover Other to the UI list', () => {
    expect(categoriesForVaultScope('my', 'OTHER').map((c) => c.value)).not.toContain('OTHER');
  });

  it('excludes out-of-scope categories without legacy extra', () => {
    expect(categoriesForVaultScope('secret').map((c) => c.value)).toContain('ADMIN');
    expect(categoriesForVaultScope('my').map((c) => c.value)).not.toContain('ADMIN');
  });

  it('returns empty create preset unless context or a single option', () => {
    expect(presetCategoryForCreate('project')).toBe('');
    expect(presetCategoryForCreate('project', 'MAIL')).toBe('MAIL');
    expect(presetCategoryForCreate('project', undefined, ['DOMAIN'])).toBe('DOMAIN');
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
    expect(filterCredentialsByQuickCategory(credentials, 'SERVICE', chips)).toEqual([
      credentials[2],
    ]);
    expect(filterCredentialsByQuickCategory(credentials, null, chips)).toEqual(credentials);
  });
});
