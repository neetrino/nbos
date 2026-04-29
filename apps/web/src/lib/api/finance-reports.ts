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
}

export interface FinanceReportDefinitionsResponse {
  items: FinanceReportDefinition[];
  meta: {
    count: number;
    scope: string;
    phase6Boundary: string;
  };
}

export const financeReportsApi = {
  async getDefinitions(): Promise<FinanceReportDefinitionsResponse> {
    const resp = await api.get<FinanceReportDefinitionsResponse>(
      '/api/finance/reports/definitions',
    );
    return resp.data;
  },
};
