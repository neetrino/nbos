import { describe, expect, it } from 'vitest';
import {
  expenseBacklogPageTitle,
  expenseDetailPageTitle,
  expensesListPageTitle,
  expensePlansListPageTitle,
  financeDashboardPageTitle,
  invoicesListPageTitle,
  ordersListPageTitle,
  paymentsListPageTitle,
  payrollRunDetailPageTitle,
  payrollRunsListPageTitle,
  employeeWalletPageTitle,
  subscriptionDetailPageTitle,
  subscriptionsListPageTitle,
} from './finance-route-page-titles';

describe('finance route page titles', () => {
  it('financeDashboardPageTitle', () => {
    expect(financeDashboardPageTitle()).toBe('Dashboard');
  });

  it('paymentsListPageTitle', () => {
    expect(paymentsListPageTitle()).toBe('Payments');
  });

  it('payrollRunsListPageTitle', () => {
    expect(payrollRunsListPageTitle()).toBe('Payroll');
  });

  it('employeeWalletPageTitle', () => {
    expect(employeeWalletPageTitle()).toBe('My wallet');
  });

  it('payrollRunDetailPageTitle', () => {
    expect(payrollRunDetailPageTitle(null)).toBe('Payroll run');
    expect(payrollRunDetailPageTitle('2026-03')).toBe('Payroll · 2026-03');
  });

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

  it('expensePlansListPageTitle', () => {
    expect(expensePlansListPageTitle()).toBe('Expense plans');
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

  it('subscriptionDetailPageTitle', () => {
    expect(
      subscriptionDetailPageTitle({
        loading: true,
        loadFailed: false,
        subscriptionCode: 'SUB-1',
      }),
    ).toBeUndefined();

    expect(
      subscriptionDetailPageTitle({
        loading: false,
        loadFailed: true,
        subscriptionCode: null,
      }),
    ).toBe('Subscription');

    expect(
      subscriptionDetailPageTitle({
        loading: false,
        loadFailed: false,
        subscriptionCode: '  ',
      }),
    ).toBe('Subscription');

    expect(
      subscriptionDetailPageTitle({
        loading: false,
        loadFailed: false,
        subscriptionCode: 'SUB-42',
      }),
    ).toBe('SUB-42');
  });
});
