import { describe, expect, it } from 'vitest';
import { FINANCE_CLIENT_SERVICES_MODULE } from '@nbos/shared/constants';
import {
  FINANCE_EXPENSES_NAV,
  FINANCE_REVENUE_NAV,
  permittedFinanceZoneNav,
} from './finance-module-nav';

describe('permittedFinanceZoneNav', () => {
  it('hides pills the viewer cannot open', () => {
    const can = (action: string, module: string) =>
      action === 'VIEW' && module === 'FINANCE_INVOICES';

    expect(permittedFinanceZoneNav(FINANCE_REVENUE_NAV, can)?.map((item) => item.href)).toEqual([
      '/finance/orders',
      '/finance/invoices',
    ]);
  });

  it('hides the row when fewer than two pills remain', () => {
    const can = () => false;
    expect(permittedFinanceZoneNav(FINANCE_REVENUE_NAV, can)).toBeNull();
  });

  it('drops Pay Now and Expenses Plan when only client services is granted', () => {
    const can = (action: string, module: string) =>
      action === 'VIEW' && module === FINANCE_CLIENT_SERVICES_MODULE;

    expect(permittedFinanceZoneNav(FINANCE_EXPENSES_NAV, can)).toBeNull();
  });

  it('keeps Pay Now and Client services when plans are denied', () => {
    const can = (action: string, module: string) =>
      action === 'VIEW' &&
      (module === 'FINANCE_EXPENSES' || module === FINANCE_CLIENT_SERVICES_MODULE);

    expect(permittedFinanceZoneNav(FINANCE_EXPENSES_NAV, can)?.map((item) => item.href)).toEqual([
      '/finance/expenses',
      '/finance/client-services',
    ]);
  });
});
