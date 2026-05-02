import {
  financeReportsApi,
  type CashFlowReport,
  type CompanyPnlReport,
} from '@/lib/api/finance-reports';
import type {
  ExpensePlanVsActualReport,
  MrrSubscriptionRevenueReport,
  PayrollReport,
  ProjectPnlReport,
} from '@/lib/api/finance-reports';
import { leadsApi, type LeadStats } from '@/lib/api/leads';
import { dealsApi, type DealStats } from '@/lib/api/deals';
import { marketingApi, type MarketingDashboardSummary } from '@/lib/api/marketing';
import { productsApi, type ProductStats } from '@/lib/api/products';
import { extensionsApi, type ExtensionStats } from '@/lib/api/extensions';
import { tasksApi, type TaskStats } from '@/lib/api/tasks';
import type { ReportFilterState } from '../report-filters';
import { useLazyReportTabData } from './useLazyReportTabData';

export interface FinanceReportsTabData {
  companyPnl: CompanyPnlReport;
  cashFlow: CashFlowReport;
  expensePlanVsActual: ExpensePlanVsActualReport;
  mrrSubscriptionRevenue: MrrSubscriptionRevenueReport;
  payrollReport: PayrollReport;
  projectPnl: ProjectPnlReport;
}

export interface SalesReportsTabData {
  leads: LeadStats;
  deals: DealStats;
}

export interface ProjectsReportsTabData {
  products: ProductStats;
  extensions: ExtensionStats;
}

export function useFinanceReportsTabData(enabled: boolean, filters: ReportFilterState) {
  return useLazyReportTabData(
    enabled,
    filters,
    loadFinanceReports,
    'Finance reports could not load.',
  );
}

export function useSalesReportsTabData(enabled: boolean, filters: ReportFilterState) {
  return useLazyReportTabData(enabled, filters, loadSalesReports, 'Sales reports could not load.');
}

export function useMarketingReportsTabData(enabled: boolean, filters: ReportFilterState) {
  return useLazyReportTabData(
    enabled,
    filters,
    loadMarketingReports,
    'Marketing reports could not load.',
  );
}

export function useProjectsReportsTabData(enabled: boolean, filters: ReportFilterState) {
  return useLazyReportTabData(
    enabled,
    filters,
    loadProjectsReports,
    'Project reports could not load.',
  );
}

export function useSpecialistsReportsTabData(enabled: boolean, filters: ReportFilterState) {
  return useLazyReportTabData(
    enabled,
    filters,
    loadSpecialistsReports,
    'Specialist reports could not load.',
  );
}

async function loadFinanceReports(filters: Record<string, string>): Promise<FinanceReportsTabData> {
  const [
    companyPnl,
    cashFlow,
    expensePlanVsActual,
    mrrSubscriptionRevenue,
    payrollReport,
    projectPnl,
  ] = await Promise.all([
    financeReportsApi.getCompanyPnl(filters),
    financeReportsApi.getCashFlow(filters),
    financeReportsApi.getExpensePlanVsActual(filters),
    financeReportsApi.getMrrSubscriptionRevenue(filters),
    financeReportsApi.getPayrollReport(filters),
    financeReportsApi.getProjectPnl(filters),
  ]);
  return {
    companyPnl,
    cashFlow,
    expensePlanVsActual,
    mrrSubscriptionRevenue,
    payrollReport,
    projectPnl,
  };
}

async function loadSalesReports(): Promise<SalesReportsTabData> {
  const [leads, deals] = await Promise.all([leadsApi.getStats(), dealsApi.getStats()]);
  return { leads, deals };
}

async function loadMarketingReports(): Promise<MarketingDashboardSummary> {
  return marketingApi.getDashboardSummary();
}

async function loadProjectsReports(): Promise<ProjectsReportsTabData> {
  const [products, extensions] = await Promise.all([
    productsApi.getStats(),
    extensionsApi.getStats(),
  ]);
  return { products, extensions };
}

async function loadSpecialistsReports(): Promise<TaskStats> {
  return tasksApi.getStats();
}
