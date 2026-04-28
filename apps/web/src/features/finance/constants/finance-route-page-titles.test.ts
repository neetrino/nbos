import { describe, expect, it } from 'vitest';
import {
  expenseBacklogPageTitle,
  expenseDetailPageTitle,
  expensesListPageTitle,
  invoicesListPageTitle,
  ordersListPageTitle,
  subscriptionsListPageTitle,
} from './finance-route-page-titles';

describe('finance route page titles', () => {
  it('invoicesListPageTitle', () => {
    expect(invoicesListPageTitle(false)).toBe('Invoices');
    expect(invoicesListPageTitle(true)).toBe('Invoices · subscription filter');
  });

  it('ordersListPageTitle', () => {
    expect(ordersListPageTitle(false, false)).toBe('Orders');
    expect(ordersListPageTitle(true, false)).toBe('Orders · partner filter');
    expect(ordersListPageTitle(false, true)).toBe('Orders · reconciliation filter');
    expect(ordersListPageTitle(true, true)).toBe('Orders · partner & gap filter');
  });

  it('subscriptionsListPageTitle', () => {
    expect(subscriptionsListPageTitle(false)).toBe('Subscriptions');
    expect(subscriptionsListPageTitle(true)).toBe('Subscriptions · partner filter');
  });

  it('expensesListPageTitle', () => {
    expect(expensesListPageTitle(false)).toBe('Expenses');
    expect(expensesListPageTitle(true)).toBe('Expenses · project filter');
  });

  it('expenseBacklogPageTitle', () => {
    expect(expenseBacklogPageTitle(false)).toBe('Expense backlog');
    expect(expenseBacklogPageTitle(true)).toBe('Expense backlog · project filter');
  });

  it('expenseDetailPageTitle', () => {
    expect(
      expenseDetailPageTitle({
        loading: true,
        loadFailed: false,
        expenseName: 'Rent',
        fromBacklog: false,
        hasProjectDrilldown: false,
      }),
    ).toBeUndefined();

    expect(
      expenseDetailPageTitle({
        loading: false,
        loadFailed: true,
        expenseName: null,
        fromBacklog: true,
        hasProjectDrilldown: true,
      }),
    ).toBe('Expense');

    expect(
      expenseDetailPageTitle({
        loading: false,
        loadFailed: false,
        expenseName: 'Rent',
        fromBacklog: false,
        hasProjectDrilldown: false,
      }),
    ).toBe('Rent');

    expect(
      expenseDetailPageTitle({
        loading: false,
        loadFailed: false,
        expenseName: 'Rent',
        fromBacklog: true,
        hasProjectDrilldown: false,
      }),
    ).toBe('Rent · backlog');

    expect(
      expenseDetailPageTitle({
        loading: false,
        loadFailed: false,
        expenseName: 'Rent',
        fromBacklog: false,
        hasProjectDrilldown: true,
      }),
    ).toBe('Rent · project filter');

    expect(
      expenseDetailPageTitle({
        loading: false,
        loadFailed: false,
        expenseName: 'Rent',
        fromBacklog: true,
        hasProjectDrilldown: true,
      }),
    ).toBe('Rent · backlog · project filter');
  });
});
