import { api } from '../api';

export type FinanceReportDefinitionId =
  | 'company-pnl'
  | 'project-pnl'
  | 'cash-flow'
  | 'mrr-subscription-revenue'
  | 'expense-plan-vs-actual'
  | 'payroll-report';

export interface FinanceReportDefinition {
  id: FinanceReportDefinitionId;
  title: string;
  audience: string[];
  description: string;
  v1Status: 'definition_ready' | 'partial_sources' | 'needs_aggregate_endpoint';
  sourceEndpoints: string[];
  drillDownHrefs: string[];
  phase3Scope: string;
  phase6Deferred: string;
  aggregateEndpoint?: string;
}

export interface FinanceReportDefinitionsResponse {
  items: FinanceReportDefinition[];
  meta: {
    count: number;
    scope: string;
    phase6Boundary: string;
  };
}

export interface CompanyPnlReport {
  reportId: 'company-pnl';
  title: 'Company P&L';
  currency: 'AMD';
  period: {
    dateFrom: string | null;
    dateTo: string | null;
    basis: 'cash';
  };
  revenue: {
    incomingPayments: string;
    paymentCount: number;
  };
  costs: {
    actualExpensePayments: string;
    payrollExpensePayments: string;
    nonPayrollExpensePayments: string;
    expensePaymentCount: number;
  };
  payrollControl: {
    payrollRunCount: number;
    payrollRunPaid: string;
    payrollRunPayable: string;
  };
  profitability: {
    grossProfit: string;
    netProfit: string;
    marginPercent: number | null;
  };
  notes: string[];
}

export interface CashFlowReport {
  reportId: 'cash-flow';
  title: 'Cash Flow';
  currency: 'AMD';
  period: {
    dateFrom: string | null;
    dateTo: string | null;
    basis: 'cash';
    asOf: string;
  };
  actuals: {
    realIncoming: string;
    realOutgoing: string;
    netMovement: string;
    paymentCount: number;
    expensePaymentCount: number;
  };
  forecast: {
    expectedIncomingOpenInvoices: string;
    expectedOutgoingExpenseCards: string;
    expectedOutgoingExpensePlans: string;
    expectedOutgoingPayroll: string;
    buckets: Array<{
      horizonDays: 30 | 60 | 90;
      expectedIncoming: string;
      expectedOutgoing: string;
      netExpected: string;
    }>;
  };
  backlogDebt: {
    amount: string;
    expenseCount: number;
  };
  notes: string[];
}

export interface ExpensePlanVsActualReport {
  reportId: 'expense-plan-vs-actual';
  title: 'Expense Plan vs Actual';
  currency: 'AMD';
  period: {
    dateFrom: string | null;
    dateTo: string | null;
    basis: 'cash';
  };
  totals: {
    plannedAmount: string;
    generatedCardAmount: string;
    paidAmount: string;
    variancePlannedVsPaid: string;
    planCount: number;
    cardCount: number;
    paymentCount: number;
  };
  byCategory: Array<{
    category: string;
    plannedAmount: string;
    generatedCardAmount: string;
    paidAmount: string;
    variancePlannedVsPaid: string;
    planCount: number;
    cardCount: number;
    paymentCount: number;
  }>;
  notes: string[];
}

export interface MrrSubscriptionRevenueReport {
  reportId: 'mrr-subscription-revenue';
  title: 'MRR / Subscription Revenue';
  currency: 'AMD';
  period: {
    dateFrom: string | null;
    dateTo: string | null;
    snapshotDate: string;
    basis: 'cash';
  };
  active: {
    activeMrr: string;
    activeSubscriptionCount: number;
    byType: Array<{
      type: string;
      activeSubscriptionCount: number;
      activeMrr: string;
    }>;
  };
  movement: {
    newMrr: string;
    newSubscriptionCount: number;
    churnedMrr: string;
    churnedSubscriptionCount: number;
  };
  paidRevenue: {
    paidSubscriptionRevenue: string;
    paymentCount: number;
    invoicedSubscriptionAmount: string;
    invoiceCount: number;
  };
  notes: string[];
}

export const financeReportsApi = {
  async getDefinitions(): Promise<FinanceReportDefinitionsResponse> {
    const resp = await api.get<FinanceReportDefinitionsResponse>(
      '/api/finance/reports/definitions',
    );
    return resp.data;
  },

  async getCompanyPnl(): Promise<CompanyPnlReport> {
    const resp = await api.get<CompanyPnlReport>('/api/finance/reports/company-pnl');
    return resp.data;
  },

  async getCashFlow(): Promise<CashFlowReport> {
    const resp = await api.get<CashFlowReport>('/api/finance/reports/cash-flow');
    return resp.data;
  },

  async getExpensePlanVsActual(): Promise<ExpensePlanVsActualReport> {
    const resp = await api.get<ExpensePlanVsActualReport>(
      '/api/finance/reports/expense-plan-vs-actual',
    );
    return resp.data;
  },

  async getMrrSubscriptionRevenue(): Promise<MrrSubscriptionRevenueReport> {
    const resp = await api.get<MrrSubscriptionRevenueReport>(
      '/api/finance/reports/mrr-subscription-revenue',
    );
    return resp.data;
  },
};
