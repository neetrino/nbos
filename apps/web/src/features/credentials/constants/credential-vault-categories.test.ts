import { describe, expect, it } from 'vitest';
import { categoriesForVaultScope } from './credential-vault-categories';

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
});
