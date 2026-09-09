import { describe, expect, it } from 'vitest';
import { isHeaderNavItemActive } from './header-context-nav-utils';

describe('isHeaderNavItemActive', () => {
  it('matches the item href and nested paths', () => {
    expect(isHeaderNavItemActive('/projects', { href: '/projects', label: 'Project' })).toBe(true);
    expect(isHeaderNavItemActive('/projects/all', { href: '/projects', label: 'Project' })).toBe(
      true,
    );
  });

  it('respects exactMatch and exclude prefixes', () => {
    expect(
      isHeaderNavItemActive('/finance', { href: '/finance', label: 'Home', exactMatch: true }),
    ).toBe(true);
    expect(
      isHeaderNavItemActive('/finance/invoices', {
        href: '/finance',
        label: 'Home',
        exactMatch: true,
      }),
    ).toBe(false);
    expect(
      isHeaderNavItemActive('/crm/deals', {
        href: '/crm',
        label: 'CRM',
        excludeMatchPrefix: '/crm/deals',
      }),
    ).toBe(false);
  });

  it('uses a custom isActive matcher when provided', () => {
    expect(
      isHeaderNavItemActive('/projects/board', {
        href: '/projects',
        label: 'Project',
        isActive: (path) => path.startsWith('/projects/board'),
      }),
    ).toBe(true);
  });
});
