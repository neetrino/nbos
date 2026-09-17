import { describe, expect, it } from 'vitest';
import { EXPENSE_BOARD_SCOPE_FILTER_KEY } from '@/features/finance/components/expenses/expense-board-scope';
import type { Invoice, Order } from '@/lib/api/finance';
import type { ProjectSubscription } from '@/lib/api/projects';
import {
  filterProductFinanceInvoices,
  filterProductFinanceOrders,
  filterProductFinanceSubscriptions,
  productFinanceFilterValuesForUi,
  scopeProductFinanceSubscriptions,
} from './filter-product-finance-data';

function order(status: string): Order {
  return {
    id: status,
    code: `ORD-${status}`,
    projectId: 'proj-1',
    type: 'PROJECT',
    paymentType: 'ONE_TIME',
    totalAmount: '1000',
    currency: 'AMD',
    status,
    createdAt: '2026-01-01T00:00:00.000Z',
    project: { id: 'proj-1', code: 'P1', name: 'Acme' },
    invoices: [],
  };
}

function invoice(moneyStatus: string): Invoice {
  return {
    id: moneyStatus,
    code: `INV-${moneyStatus}`,
    moneyStatus,
  } as Invoice;
}

function subscription(
  partial: Partial<ProjectSubscription> & Pick<ProjectSubscription, 'id'>,
): ProjectSubscription {
  return {
    code: 'SUB-1',
    name: 'Maintenance',
    type: 'MAINTENANCE_ONLY',
    productId: 'prod-1',
    amount: '10000',
    coverageMonthCount: 1,
    monthlyEquivalentAmount: '10000',
    billingFrequency: 'MONTHLY',
    billingDay: 1,
    status: 'ACTIVE',
    billingStartDate: '2026-01-01T00:00:00.000Z',
    endDate: null,
    invoices: [],
    ...partial,
  };
}

describe('scopeProductFinanceSubscriptions', () => {
  it('keeps only rows owned by the product', () => {
    const rows = [
      subscription({ id: 'a', productId: 'prod-1' }),
      subscription({ id: 'b', productId: 'prod-2' }),
      subscription({ id: 'c', productId: undefined }),
    ];
    expect(scopeProductFinanceSubscriptions(rows, 'prod-1').map((row) => row.id)).toEqual(['a']);
  });
});

describe('filterProductFinanceSubscriptions', () => {
  it('filters by search and type', () => {
    const rows = [
      subscription({ id: 'a', name: 'Alpha plan', type: 'MAINTENANCE_ONLY' }),
      subscription({ id: 'b', name: 'Beta plan', type: 'DEV_ONLY' }),
    ];
    expect(
      filterProductFinanceSubscriptions(rows, 'alpha', { type: 'MAINTENANCE_ONLY' }).map(
        (row) => row.id,
      ),
    ).toEqual(['a']);
  });

  it('keeps every status by default and honors an explicit status', () => {
    const rows = [
      subscription({ id: 'active', status: 'ACTIVE' }),
      subscription({ id: 'done', status: 'COMPLETED' }),
    ];
    expect(filterProductFinanceSubscriptions(rows, '', {}).map((row) => row.id)).toEqual([
      'active',
      'done',
    ]);
    expect(
      filterProductFinanceSubscriptions(rows, '', { status: 'ACTIVE' }).map((row) => row.id),
    ).toEqual(['active']);
  });
});

describe('filterProductFinanceOrders', () => {
  it('includes closed outcomes when board scope is unset', () => {
    const rows = [order('ACTIVE'), order('FULLY_PAID')];
    expect(filterProductFinanceOrders(rows, '', {}).map((row) => row.status)).toEqual([
      'ACTIVE',
      'FULLY_PAID',
    ]);
  });

  it('narrows to the active pipeline when scope is Active', () => {
    const rows = [order('ACTIVE'), order('FULLY_PAID')];
    expect(
      filterProductFinanceOrders(rows, '', { boardScope: 'ACTIVE' }).map((row) => row.status),
    ).toEqual(['ACTIVE']);
  });

  it('matches the deal title used on global Finance cards', () => {
    const rows = [
      {
        ...order('PENDING_PAYMENT'),
        id: 'feedback',
        code: 'ORD-2026-0180',
        deal: { id: 'deal-1', name: 'FEEDBACK FORM', code: 'D-1' },
      },
      order('ACTIVE'),
    ];
    expect(filterProductFinanceOrders(rows, 'feedback', {}).map((row) => row.id)).toEqual([
      'feedback',
    ]);
  });
});

describe('filterProductFinanceInvoices', () => {
  it('includes paid and cancelled when board scope is unset', () => {
    const rows = [invoice('NEW'), invoice('PAID'), invoice('CANCELLED')];
    expect(filterProductFinanceInvoices(rows, '', {}).map((row) => row.moneyStatus)).toEqual([
      'NEW',
      'PAID',
      'CANCELLED',
    ]);
  });
});

describe('productFinanceFilterValuesForUi', () => {
  it('surfaces All as the default scope and status chips', () => {
    expect(productFinanceFilterValuesForUi('orders', {}).boardScope).toBe('ALL');
    expect(productFinanceFilterValuesForUi('invoices', {}).boardScope).toBe('ALL');
    expect(productFinanceFilterValuesForUi('subscriptions', {}).status).toBe('all');
    expect(productFinanceFilterValuesForUi('expenses', {})[EXPENSE_BOARD_SCOPE_FILTER_KEY]).toBe(
      'all',
    );
    expect(productFinanceFilterValuesForUi('client-services', {}).status).toBe('all');
  });
});
