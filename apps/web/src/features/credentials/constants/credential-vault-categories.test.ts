import { describe, expect, it } from 'vitest';
import {
  categoriesForVaultScope,
  isCategoryAllowedInVaultScope,
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

  it('validates scope membership', () => {
    expect(isCategoryAllowedInVaultScope('secret', 'ADMIN')).toBe(true);
    expect(isCategoryAllowedInVaultScope('my', 'ADMIN')).toBe(false);
  });
});
