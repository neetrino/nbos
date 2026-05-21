import type { FinanceDashboardData } from './finance-dashboard-data';

export type FinanceZoneHubOverviewMetrics = {
  reconciliationWarningCount: number;
};

export type FinanceZoneHubRevenueMetrics = {
  outstandingAmount: number;
  monthlyRecurringRevenue: number;
};

export type FinanceZoneHubExpensesMetrics = {
  openCardCount: number;
  openCardAmount: number;
};

export type FinanceZoneHubPayrollMetrics = {
  runCount: number;
  remainingPayable: number;
};

export type FinanceZoneHubMetrics = {
  overview: FinanceZoneHubOverviewMetrics;
  revenue: FinanceZoneHubRevenueMetrics;
  expenses: FinanceZoneHubExpensesMetrics;
  payroll: FinanceZoneHubPayrollMetrics;
};

/** Roll-up dashboard API data into per-zone hub card metrics. */
export function buildFinanceZoneHubMetrics(data: FinanceDashboardData): FinanceZoneHubMetrics {
  let openCardCount = 0;
  let openCardAmount = 0;
  for (const bucket of data.expenseBuckets) {
    openCardCount += bucket.count;
    openCardAmount += bucket.amount;
  }

  return {
    overview: {
      reconciliationWarningCount: data.reconciliation.warnings.length,
    },
    revenue: {
      outstandingAmount: data.outstandingAmount,
      monthlyRecurringRevenue: data.monthlyRecurringRevenue,
    },
    expenses: {
      openCardCount,
      openCardAmount,
    },
    payroll: {
      runCount: data.payrollRuns.runCount,
      remainingPayable: data.payrollRuns.totalRemaining,
    },
  };
}
