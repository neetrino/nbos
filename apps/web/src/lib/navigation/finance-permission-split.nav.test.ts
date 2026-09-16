import { describe, expect, it } from 'vitest';
import {
  FINANCE_CLIENT_SERVICES_MODULE,
  FINANCE_EXPENSE_PLANS_MODULE,
} from '@nbos/shared/constants';
import { FINANCE_HEADER_ZONES } from '@/features/finance/constants/finance-header-zones';
import {
  FINANCE_EXPENSES_NAV,
  FINANCE_REVENUE_NAV,
  permittedFinanceZoneNav,
} from '@/features/finance/finance-module-nav';
import { FINANCE_MODULE_VIEW_REQUIREMENT } from './finance-nav-permissions';
import { hasNavPermission } from './nav-visibility';
import { resolveNavPermission } from './resolve-nav-permission';

function canView(module: string): (action: string, granted: string) => boolean {
  return (action, granted) => action === 'VIEW' && granted === module;
}

function canViewAny(modules: readonly string[]): (action: string, granted: string) => boolean {
  return (action, granted) => action === 'VIEW' && modules.includes(granted);
}

const CS = canView(FINANCE_CLIENT_SERVICES_MODULE);
const PLANS = canView(FINANCE_EXPENSE_PLANS_MODULE);
const EXPENSES = canView('FINANCE_EXPENSES');

function permitted(pathname: string, can: (action: string, module: string) => boolean): boolean {
  return hasNavPermission(resolveNavPermission(pathname), can);
}

function visibleZones(can: (action: string, module: string) => boolean): string[] {
  return FINANCE_HEADER_ZONES.filter((zone) => hasNavPermission(zone.permission, can)).map(
    (zone) => zone.zone,
  );
}

describe('finance permission-split navigation', () => {
  it('lets a client-services-only user open Finance and that registry only', () => {
    expect(permitted('/finance', CS)).toBe(true);
    expect(permitted('/finance/client-services', CS)).toBe(true);
    expect(permitted('/finance/expenses', CS)).toBe(false);
    expect(permitted('/finance/expenses/plans', CS)).toBe(false);
    expect(permitted('/finance/invoices', CS)).toBe(false);
    expect(visibleZones(CS)).toEqual(['expenses']);
    expect(permittedFinanceZoneNav(FINANCE_EXPENSES_NAV, CS)).toBeNull();
    expect(permittedFinanceZoneNav(FINANCE_REVENUE_NAV, CS)).toBeNull();
  });

  it('lets an expense-plans-only user open plans and not the journal or registry', () => {
    expect(permitted('/finance', PLANS)).toBe(true);
    expect(permitted('/finance/expenses/plans', PLANS)).toBe(true);
    expect(permitted('/finance/expenses', PLANS)).toBe(false);
    expect(permitted('/finance/client-services', PLANS)).toBe(false);
    expect(visibleZones(PLANS)).toEqual(['expenses']);
    expect(permittedFinanceZoneNav(FINANCE_EXPENSES_NAV, PLANS)).toBeNull();
  });

  it('does not grant the new areas from FINANCE_EXPENSES alone', () => {
    expect(permitted('/finance', EXPENSES)).toBe(true);
    expect(permitted('/finance/expenses', EXPENSES)).toBe(true);
    expect(permitted('/finance/expenses/plans', EXPENSES)).toBe(false);
    expect(permitted('/finance/client-services', EXPENSES)).toBe(false);
    expect(visibleZones(EXPENSES)).toEqual(['expenses']);
  });

  it('exposes in-zone tabs only for the granted expense-area entries', () => {
    expect(
      permittedFinanceZoneNav(
        FINANCE_EXPENSES_NAV,
        canViewAny(['FINANCE_EXPENSES', FINANCE_CLIENT_SERVICES_MODULE]),
      )?.map((item) => item.href),
    ).toEqual(['/finance/expenses', '/finance/client-services']);
    expect(
      permittedFinanceZoneNav(
        FINANCE_EXPENSES_NAV,
        canViewAny([FINANCE_EXPENSE_PLANS_MODULE, FINANCE_CLIENT_SERVICES_MODULE]),
      )?.map((item) => item.href),
    ).toEqual(['/finance/expenses/plans', '/finance/client-services']);
  });

  it('treats the Finance hub anyOf as OR and fails closed when empty', () => {
    expect(hasNavPermission(FINANCE_MODULE_VIEW_REQUIREMENT, CS)).toBe(true);
    expect(hasNavPermission(FINANCE_MODULE_VIEW_REQUIREMENT, PLANS)).toBe(true);
    expect(hasNavPermission(FINANCE_MODULE_VIEW_REQUIREMENT, EXPENSES)).toBe(true);
    expect(hasNavPermission(FINANCE_MODULE_VIEW_REQUIREMENT, canView('FINANCE_INVOICES'))).toBe(
      true,
    );
    expect(hasNavPermission({ anyOf: [] }, () => true)).toBe(false);
  });
});
