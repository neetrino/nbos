import { describe, expect, it } from 'vitest';
import { resolveNavPermission } from './resolve-nav-permission';

describe('resolveNavPermission', () => {
  it('resolves dashboard permission', () => {
    expect(resolveNavPermission('/dashboard')).toEqual({
      module: 'DASHBOARDS',
      action: 'VIEW',
    });
  });

  it('resolves clients nested paths', () => {
    expect(resolveNavPermission('/clients/contacts')).toEqual({
      module: 'CLIENTS',
      action: 'VIEW',
    });
  });

  it('resolves settings child with its own permission', () => {
    expect(resolveNavPermission('/settings/roles')).toEqual({
      module: 'COMPANY',
      action: 'ADD',
    });
  });

  it('returns undefined for routes without nav permission', () => {
    expect(resolveNavPermission('/my-account')).toBeUndefined();
  });
});
