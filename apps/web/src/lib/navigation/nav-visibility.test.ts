import { describe, expect, it } from 'vitest';
import { FINANCE_CLIENT_SERVICES_MODULE } from '@nbos/shared/constants';
import { NAV_MODULE_DEFINITIONS, type NavModuleDefinition } from './nav-config';
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

  it('grants anyOf when any clause matches', () => {
    const canClientServices = (action: string, module: string) =>
      action === 'VIEW' && module === FINANCE_CLIENT_SERVICES_MODULE;

    expect(
      hasNavPermission(
        {
          anyOf: [
            { module: 'FINANCE_INVOICES', action: 'VIEW' },
            { module: FINANCE_CLIENT_SERVICES_MODULE, action: 'VIEW' },
          ],
        },
        canClientServices,
      ),
    ).toBe(true);
    expect(
      hasNavPermission(
        {
          anyOf: [
            { module: 'FINANCE_INVOICES', action: 'VIEW' },
            { module: 'FINANCE_EXPENSES', action: 'VIEW' },
          ],
        },
        canClientServices,
      ),
    ).toBe(false);
  });

  it('denies an empty anyOf even when can() would grant everything', () => {
    expect(hasNavPermission({ anyOf: [] }, canAll)).toBe(false);
  });
});

describe('getVisibleNavModules', () => {
  const aiModule: NavModuleDefinition = {
    key: 'ai-agents',
    label: 'modules.ai-agents',
    href: '/ai-agents',
    permission: { module: 'AI_PLATFORM', action: 'VIEW' },
  };

  it('hides permissioned modules while permissions are loading', () => {
    const definitions: NavModuleDefinition[] = [
      { key: 'dashboard', label: 'modules.dashboard', href: '/dashboard' },
      {
        key: 'clients',
        label: 'modules.clients',
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
        label: 'modules.clients',
        href: '/clients',
        permission: { module: 'CLIENTS', action: 'VIEW' },
      },
    ];
    expect(getVisibleNavModules(canNone, false, definitions)).toEqual([]);
  });

  it('shows Finance when only client-services VIEW is granted', () => {
    const can = (action: string, module: string) =>
      action === 'VIEW' && module === FINANCE_CLIENT_SERVICES_MODULE;

    expect(
      getVisibleNavModules(can, false, NAV_MODULE_DEFINITIONS).some(
        (item) => item.key === 'finance',
      ),
    ).toBe(true);
  });

  it('hides Finance when no reachable Finance VIEW is granted', () => {
    expect(
      getVisibleNavModules(canNone, false, NAV_MODULE_DEFINITIONS).some(
        (item) => item.key === 'finance',
      ),
    ).toBe(false);
  });

  it('shows My Company catalog child without opening HR or Compensation', () => {
    const canCatalogOnly = (action: string, module: string) =>
      action === 'VIEW' && module === 'FUNCTION_CATALOG';
    const visible = getVisibleNavModules(canCatalogOnly, false, NAV_MODULE_DEFINITIONS);
    const company = visible.find((item) => item.key === 'my-company');
    const hrefs = company?.children?.flatMap((child) =>
      'href' in child && child.href ? [child.href] : [],
    );

    expect(hrefs).toEqual(['/my-company/function-catalog']);
  });

  it('keeps HR hub on COMPANY without revealing the catalog', () => {
    const canCompanyOnly = (action: string, module: string) =>
      action === 'VIEW' && module === 'COMPANY';
    const visible = getVisibleNavModules(canCompanyOnly, false, NAV_MODULE_DEFINITIONS);
    const company = visible.find((item) => item.key === 'my-company');
    const hrefs = company?.children?.flatMap((child) =>
      'href' in child && child.href ? [child.href] : [],
    );

    expect(hrefs ?? []).not.toContain('/my-company/function-catalog');
    expect(hrefs ?? []).not.toContain('/my-company/compensation');
  });
});
