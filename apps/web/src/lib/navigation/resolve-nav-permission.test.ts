import { describe, expect, it } from 'vitest';
import { resolveNavPermission } from './resolve-nav-permission';
import { EXPLICIT_ROUTE_PERMISSIONS } from './route-permissions';

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

  it('gates the Settings hub itself', () => {
    expect(resolveNavPermission('/settings')).toEqual({
      module: 'SETTINGS',
      action: 'VIEW',
    });
  });

  it('resolves settings child with its own permission', () => {
    expect(resolveNavPermission('/settings/roles')).toEqual({
      module: 'SETTINGS_RBAC',
      action: 'VIEW',
    });
  });

  it('gates settings routes that have no sidebar link', () => {
    expect(resolveNavPermission('/settings/access-policies')).toEqual({
      module: 'SETTINGS_RBAC',
      action: 'VIEW',
    });
    expect(resolveNavPermission('/settings/trash-inventory')).toEqual({
      module: 'SETTINGS',
      action: 'VIEW',
    });
  });

  it('keeps every gated Settings route off the My Company COMPANY key', () => {
    const modules = EXPLICIT_ROUTE_PERMISSIONS.map((route) => route.permission.module);

    expect(modules).not.toContain('COMPANY');
  });

  it('falls back to the Settings gate for unlisted settings subpaths', () => {
    expect(resolveNavPermission('/settings/departments')).toEqual({
      module: 'SETTINGS',
      action: 'VIEW',
    });
    expect(resolveNavPermission('/settings/something-new')).toEqual({
      module: 'SETTINGS',
      action: 'VIEW',
    });
  });

  it('does not treat the marketing settings page as platform admin', () => {
    expect(resolveNavPermission('/marketing/settings')).toEqual({
      module: 'MARKETING',
      action: 'VIEW',
    });
  });

  it('returns undefined for routes without nav permission', () => {
    expect(resolveNavPermission('/my-account')).toBeUndefined();
  });
});
