import { describe, expect, it } from 'vitest';
import {
  accessLevelForVaultScope,
  canCreateInVaultScope,
  vaultScopeToListTab,
} from '@/features/credentials/vault-scope';

describe('vault-scope', () => {
  it('maps company scope to list tab and ALL access level', () => {
    expect(vaultScopeToListTab('company')).toBe('company');
    expect(accessLevelForVaultScope('company')).toBe('ALL');
  });

  it('allows create in company scope but not on All tab', () => {
    expect(canCreateInVaultScope('company')).toBe(true);
    expect(canCreateInVaultScope('all')).toBe(false);
    expect(canCreateInVaultScope('team')).toBe(true);
  });
});
