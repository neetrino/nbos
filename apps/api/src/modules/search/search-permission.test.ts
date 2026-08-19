import { describe, expect, it } from 'vitest';
import {
  hasFinanceSearchAccess,
  resolveAllowedFinanceSubtypes,
  resolveAllowedSearchGroups,
} from './search-permissions';

describe('search-permissions', () => {
  it('returns no groups when all module VIEW scopes are NONE', () => {
    const groups = resolveAllowedSearchGroups({
      CRM_LEADS_VIEW: 'NONE',
      CRM_DEALS_VIEW: 'NONE',
      PROJECTS_VIEW: 'NONE',
      FINANCE_INVOICES_VIEW: 'NONE',
      CREDENTIALS_VIEW: 'NONE',
    });
    expect(groups).toEqual([]);
  });

  it('includes finance tab when any finance module is viewable', () => {
    expect(
      hasFinanceSearchAccess({
        FINANCE_INVOICES_VIEW: 'NONE',
        FINANCE_PAYMENTS_VIEW: 'ALL',
      }),
    ).toBe(true);
  });

  it('gates finance subtypes individually', () => {
    const subtypes = resolveAllowedFinanceSubtypes({
      FINANCE_INVOICES_VIEW: 'ALL',
      FINANCE_EXPENSES_VIEW: 'NONE',
      ORDERS_VIEW: 'OWN',
      FINANCE_PAYMENTS_VIEW: 'NONE',
      FINANCE_SUBSCRIPTIONS_VIEW: 'NONE',
    });
    expect(subtypes).toEqual(['invoice', 'order']);
  });

  it('returns only permitted search groups', () => {
    const groups = resolveAllowedSearchGroups({
      CRM_LEADS_VIEW: 'ALL',
      CRM_DEALS_VIEW: 'NONE',
      PROJECTS_VIEW: 'OWN',
      FINANCE_INVOICES_VIEW: 'ALL',
      CREDENTIALS_VIEW: 'NONE',
    });
    expect(groups.map((g) => g.id)).toEqual(['leads', 'products', 'finance']);
  });
});
