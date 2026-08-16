import { describe, expect, it } from 'vitest';
import {
  countDistinctCoveredMonths,
  isBillingMonthCoveredByInvoices,
  latestCoveredMonthKey,
  type SubscriptionCoverageInvoiceRow,
} from './subscription-coverage-window';

function row(
  partial: Partial<SubscriptionCoverageInvoiceRow> & { createdAt: Date },
): SubscriptionCoverageInvoiceRow {
  return {
    type: partial.type ?? 'SUBSCRIPTION',
    coverageStartMonth: partial.coverageStartMonth ?? null,
    coverageMonthCount: partial.coverageMonthCount ?? null,
    createdAt: partial.createdAt,
  };
}

describe('isBillingMonthCoveredByInvoices', () => {
  it('covers a single monthly window', () => {
    const invoices = [
      row({
        coverageStartMonth: '2026-03',
        coverageMonthCount: 1,
        createdAt: new Date(2026, 2, 15),
      }),
    ];
    expect(isBillingMonthCoveredByInvoices('2026-03', invoices)).toBe(true);
    expect(isBillingMonthCoveredByInvoices('2026-04', invoices)).toBe(false);
  });

  it('covers months 2..12 inside a 12-month window', () => {
    const invoices = [
      row({
        coverageStartMonth: '2026-01',
        coverageMonthCount: 12,
        createdAt: new Date(2026, 0, 1),
      }),
    ];
    expect(isBillingMonthCoveredByInvoices('2026-02', invoices)).toBe(true);
    expect(isBillingMonthCoveredByInvoices('2026-12', invoices)).toBe(true);
  });

  it('does not cover the month after the window ends', () => {
    const invoices = [
      row({
        coverageStartMonth: '2026-01',
        coverageMonthCount: 12,
        createdAt: new Date(2026, 0, 1),
      }),
    ];
    expect(isBillingMonthCoveredByInvoices('2027-01', invoices)).toBe(false);
  });

  it('falls back to createdAt calendar month when coverage fields are null', () => {
    const invoices = [row({ createdAt: new Date(2026, 5, 20) })];
    expect(isBillingMonthCoveredByInvoices('2026-06', invoices)).toBe(true);
    expect(isBillingMonthCoveredByInvoices('2026-07', invoices)).toBe(false);
  });

  it('returns false for an invalid billing month key', () => {
    const invoices = [
      row({
        coverageStartMonth: '2026-03',
        coverageMonthCount: 1,
        createdAt: new Date(2026, 2, 1),
      }),
    ];
    expect(isBillingMonthCoveredByInvoices('2026-13', invoices)).toBe(false);
    expect(isBillingMonthCoveredByInvoices('bad', invoices)).toBe(false);
  });
});

describe('countDistinctCoveredMonths', () => {
  it('unions overlapping invoice windows without double-counting', () => {
    const invoices = [
      row({
        coverageStartMonth: '2026-01',
        coverageMonthCount: 3,
        createdAt: new Date(2026, 0, 1),
      }),
      row({
        coverageStartMonth: '2026-02',
        coverageMonthCount: 3,
        createdAt: new Date(2026, 1, 1),
      }),
    ];
    expect(countDistinctCoveredMonths(invoices)).toBe(4);
    expect(latestCoveredMonthKey(invoices)).toBe('2026-04');
  });

  it('ignores non-SUBSCRIPTION invoices', () => {
    const invoices = [
      row({
        type: 'ONE_TIME',
        coverageStartMonth: '2026-01',
        coverageMonthCount: 6,
        createdAt: new Date(2026, 0, 1),
      }),
      row({
        coverageStartMonth: '2026-03',
        coverageMonthCount: 1,
        createdAt: new Date(2026, 2, 1),
      }),
    ];
    expect(countDistinctCoveredMonths(invoices)).toBe(1);
  });

  it('falls back to createdAt month for legacy null coverage', () => {
    const invoices = [row({ createdAt: new Date(2026, 5, 20) })];
    expect(countDistinctCoveredMonths(invoices)).toBe(1);
    expect(latestCoveredMonthKey(invoices)).toBe('2026-06');
  });
});
