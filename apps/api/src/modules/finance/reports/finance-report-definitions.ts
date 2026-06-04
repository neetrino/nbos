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

export const FINANCE_REPORT_DEFINITIONS: FinanceReportDefinition[] = [
  {
    id: 'company-pnl',
    title: 'Company P&L',
    audience: ['CEO', 'Finance Director'],
    description: 'Revenue, costs, margin.',
    v1Status: 'definition_ready',
    sourceEndpoints: [
      '/api/finance/payments/stats',
      '/api/expenses/stats',
      '/api/payroll-runs/stats',
    ],
    drillDownHrefs: ['/finance/payments', '/finance/expenses', '/finance/payroll'],
    phase3Scope: 'Finance owns formulas and a read-only aggregate endpoint.',
    phase6Deferred: 'Global report catalog, scheduled delivery, BI presentation and accrual depth.',
    aggregateEndpoint: '/api/finance/reports/company-pnl',
  },
  {
    id: 'project-pnl',
    title: 'Project P&L',
    audience: ['CEO', 'Finance Director', 'PM limited'],
    description: 'Project profitability.',
    v1Status: 'definition_ready',
    sourceEndpoints: [
      '/api/finance/orders/stats',
      '/api/expenses/stats',
      '/api/client-services/stats',
    ],
    drillDownHrefs: ['/finance/orders', '/finance/expenses', '/finance/client-services'],
    phase3Scope: 'Server-side project profitability projection with source drill-downs.',
    phase6Deferred: 'Cross-module report center and advanced project comparison dashboards.',
    aggregateEndpoint: '/api/finance/reports/project-pnl',
  },
  {
    id: 'cash-flow',
    title: 'Cash Flow',
    audience: ['CEO', 'Finance Director'],
    description: 'Cash in and out.',
    v1Status: 'definition_ready',
    sourceEndpoints: ['/api/finance/payments/stats', '/api/expenses/stats', '/api/expense-plans'],
    drillDownHrefs: ['/finance/payments', '/finance/expenses', '/finance/expenses/plans'],
    phase3Scope: 'Read-only cash view from payments, expense payments, invoices and plans.',
    phase6Deferred: 'Bank integrations, scheduled cash forecasts and global dashboard packaging.',
    aggregateEndpoint: '/api/finance/reports/cash-flow',
  },
  {
    id: 'mrr-subscription-revenue',
    title: 'MRR / Subscription Revenue',
    audience: ['CEO', 'Finance Director'],
    description: 'Recurring revenue.',
    v1Status: 'definition_ready',
    sourceEndpoints: ['/api/finance/subscriptions/stats', '/api/finance/invoices/stats'],
    drillDownHrefs: ['/finance/subscriptions', '/finance/invoices'],
    phase3Scope:
      'Expose the definition and current active-MRR snapshot from live subscription data.',
    phase6Deferred: 'Advanced cohort, expansion, contraction and churn analytics.',
    aggregateEndpoint: '/api/finance/reports/mrr-subscription-revenue',
  },
  {
    id: 'expense-plan-vs-actual',
    title: 'Expense Plan vs Actual',
    audience: ['CEO', 'Finance Director'],
    description: 'Plan vs payments.',
    v1Status: 'definition_ready',
    sourceEndpoints: ['/api/expense-plans', '/api/expenses/stats'],
    drillDownHrefs: ['/finance/expenses/plans', '/finance/expenses'],
    phase3Scope: 'Plan/card/payment roll-up by category, project and period.',
    phase6Deferred: 'Scheduled variance reports and BI-style historical charts.',
    aggregateEndpoint: '/api/finance/reports/expense-plan-vs-actual',
  },
  {
    id: 'payroll-report',
    title: 'Payroll Report',
    audience: ['CEO', 'Finance Director'],
    description: 'Payroll totals.',
    v1Status: 'definition_ready',
    sourceEndpoints: ['/api/payroll-runs/stats'],
    drillDownHrefs: ['/finance/payroll'],
    phase3Scope: 'Wrap existing payroll stats as a named Finance-owned report definition.',
    phase6Deferred: 'Scheduled payroll packets, department comparisons and dashboard packaging.',
    aggregateEndpoint: '/api/finance/reports/payroll',
  },
];
