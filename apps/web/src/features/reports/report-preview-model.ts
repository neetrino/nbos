import type { DealStats } from '@/lib/api/deals';
import type { LeadStats } from '@/lib/api/leads';
import type { MarketingDashboardSummary } from '@/lib/api/marketing';
import type { ExtensionStats } from '@/lib/api/extensions';
import type { ProductStats } from '@/lib/api/products';
import type { TaskStats } from '@/lib/api/tasks';
import type {
  CashFlowReport,
  CompanyPnlReport,
  ExpensePlanVsActualReport,
  MrrSubscriptionRevenueReport,
  PayrollReport,
  ProjectPnlReport,
} from '@/lib/api/finance-reports';

export interface FinanceReportPreviewData {
  companyPnl: CompanyPnlReport | null;
  cashFlow: CashFlowReport | null;
  expensePlanVsActual: ExpensePlanVsActualReport | null;
  mrrSubscriptionRevenue: MrrSubscriptionRevenueReport | null;
  payrollReport: PayrollReport | null;
  projectPnl: ProjectPnlReport | null;
}

export interface ReportPreviewData {
  finance: FinanceReportPreviewData;
  leads: LeadStats | null;
  deals: DealStats | null;
  marketing: MarketingDashboardSummary | null;
  products: ProductStats | null;
  extensions: ExtensionStats | null;
  tasks: TaskStats | null;
}

export const EMPTY_FINANCE_REPORT_PREVIEW_DATA: FinanceReportPreviewData = {
  companyPnl: null,
  cashFlow: null,
  expensePlanVsActual: null,
  mrrSubscriptionRevenue: null,
  payrollReport: null,
  projectPnl: null,
};

export const EMPTY_REPORT_PREVIEW_DATA: ReportPreviewData = {
  finance: EMPTY_FINANCE_REPORT_PREVIEW_DATA,
  leads: null,
  deals: null,
  marketing: null,
  products: null,
  extensions: null,
  tasks: null,
};
