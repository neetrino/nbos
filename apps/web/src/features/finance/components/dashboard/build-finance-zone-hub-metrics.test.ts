import { describe, expect, it } from 'vitest';
import { buildFinanceZoneHubMetrics } from './build-finance-zone-hub-metrics';
import type { FinanceDashboardData } from './finance-dashboard-data';

function minimalDashboardData(overrides: Partial<FinanceDashboardData> = {}): FinanceDashboardData {
  return {
    totalRevenue: 100,
    outstandingAmount: 40,
    overdueAmount: 10,
    monthlyRecurringRevenue: 25,
    expenseBuckets: [
      { key: 'dueNow', label: 'Due now', count: 2, amount: 500 },
      { key: 'backlog', label: 'Backlog', count: 1, amount: 100 },
    ],
    reconciliation: {
      orderCount: 0,
      orderAmount: 0,
      invoicedAmount: 0,
      paidAmount: 0,
      uninvoicedAmount: 0,
      outstandingAmount: 0,
      fullyInvoicedCount: 0,
      fullyPaidCount: 0,
      warnings: [{ code: 'UNINVOICED_ORDERS', message: 'x', count: 3 }],
    },
    invoiceStatusItems: [],
    recentPayments: [],
    upcomingInvoices: [],
    payrollRuns: {
      runCount: 2,
      totalPayable: 1000,
      totalPaid: 400,
      totalRemaining: 600,
    },
    ...overrides,
  };
}

describe('buildFinanceZoneHubMetrics', () => {
  it('aggregates expense buckets and reconciliation warnings', () => {
    const metrics = buildFinanceZoneHubMetrics(minimalDashboardData());
    expect(metrics.expenses.openCardCount).toBe(3);
    expect(metrics.expenses.openCardAmount).toBe(600);
    expect(metrics.overview.reconciliationWarningCount).toBe(1);
    expect(metrics.payroll.remainingPayable).toBe(600);
  });
});
