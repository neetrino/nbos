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
};
