import { describe, expect, it } from 'vitest';
import type { NavModuleDefinition } from './nav-config';
import { getVisibleNavModules, hasNavPermission } from './nav-visibility';

const canNone = () => false;
const canAll = () => true;

describe('hasNavPermission', () => {
  it('allows when permission is undefined', () => {
    expect(hasNavPermission(undefined, canNone)).toBe(true);
  });

  it('delegates to can when permission is set', () => {
    expect(hasNavPermission({ module: 'CLIENTS', action: 'VIEW' }, canAll)).toBe(true);
    expect(hasNavPermission({ module: 'CLIENTS', action: 'VIEW' }, canNone)).toBe(false);
  });
});

describe('getVisibleNavModules', () => {
  const aiModule: NavModuleDefinition = {
    key: 'ai-agents',
    label: 'AI & Agents',
    href: '/ai-agents',
    permission: { module: 'AI_PLATFORM', action: 'VIEW' },
  };

  it('hides permissioned modules while permissions are loading', () => {
    const definitions: NavModuleDefinition[] = [
      { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
      {
        key: 'clients',
        label: 'Clients',
        href: '/clients',
        permission: { module: 'CLIENTS', action: 'VIEW' },
      },
    ];

    expect(getVisibleNavModules(canAll, true, definitions).map((item) => item.key)).toEqual([
      'dashboard',
    ]);
  });

  it('hides AI parent when AI_PLATFORM VIEW is denied even if children lack permission', () => {
    expect(getVisibleNavModules(canNone, false, [aiModule])).toEqual([]);
  });

  it('shows AI parent when AI_PLATFORM VIEW is granted', () => {
    const visible = getVisibleNavModules(canAll, false, [aiModule]);
    expect(visible).toHaveLength(1);
    expect(visible[0]?.children).toBeUndefined();
  });

  it('hides clients without CLIENTS VIEW', () => {
    const definitions: NavModuleDefinition[] = [
      {
        key: 'clients',
        label: 'Clients',
        href: '/clients',
        permission: { module: 'CLIENTS', action: 'VIEW' },
      },
    ];
    expect(getVisibleNavModules(canNone, false, definitions)).toEqual([]);
  });
});
