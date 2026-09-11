import { describe, expect, it } from 'vitest';
import { isMobileAppMenuItemActive } from './mobile-app-menu-constants';

describe('isMobileAppMenuItemActive', () => {
  it('matches the module entry and nested paths', () => {
    expect(isMobileAppMenuItemActive('/tasks', '/tasks', '/tasks')).toBe(true);
    expect(isMobileAppMenuItemActive('/tasks/board', '/tasks', '/tasks')).toBe(true);
    expect(isMobileAppMenuItemActive('/crm/deals', '/crm', '/crm/deals')).toBe(true);
  });

  it('does not match a sibling module', () => {
    expect(isMobileAppMenuItemActive('/credentials', '/tasks', '/tasks')).toBe(false);
  });
});
