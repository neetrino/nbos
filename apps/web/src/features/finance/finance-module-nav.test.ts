import { describe, expect, it } from 'vitest';
import { FINANCE_REVENUE_NAV, permittedFinanceZoneNav } from './finance-module-nav';

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
});
