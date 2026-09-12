import { describe, expect, it } from 'vitest';
import { pruneNavChildGroups } from './prune-nav-child-groups';
import type { NavChildDefinition } from './nav-config';

describe('pruneNavChildGroups', () => {
  it('removes group headers with no following links', () => {
    const children: NavChildDefinition[] = [
      { kind: 'group', label: 'children.settings.general' },
      { kind: 'group', label: 'children.settings.security' },
      { label: 'children.settings.auditLog', href: '/finance/invoices' },
    ];

    expect(pruneNavChildGroups(children)).toEqual([
      { kind: 'group', label: 'children.settings.security' },
      { label: 'children.settings.auditLog', href: '/finance/invoices' },
    ]);
  });
});
