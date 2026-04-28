import type { ComponentType } from 'react';
import type { FinanceDashboardSummary } from '@/lib/api/finance';

export interface FinanceDashboardData {
  totalRevenue: number;
  outstandingAmount: number;
  overdueAmount: number;
  monthlyRecurringRevenue: number;
  reconciliation: FinanceDashboardSummary['reconciliation'];
  invoiceStatusItems: InvoiceStatusItem[];
  recentPayments: RecentPaymentItem[];
  upcomingInvoices: UpcomingInvoiceItem[];
}

export interface FinanceKpi {
  label: string;
  value: string;
  change: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconText: string;
}

export interface InvoiceStatusItem {
  label: string;
  count: number;
  amount: number;
  color: string;
  pct: number;
}

export interface RecentPaymentItem {
  id: string;
  client: string;
  invoice: string;
  amount: number;
  dateLabel: string;
}

export interface UpcomingInvoiceItem {
  id: string;
  invoice: string;
  client: string;
  amount: number;
  dueDateLabel: string;
  daysLeft: number;
}

const MS_PER_DAY = 86_400_000;

const INVOICE_STATUS_META: Record<string, { label: string; color: string }> = {
  PAID: { label: 'Paid', color: 'bg-emerald-500' },
  WAITING: { label: 'Waiting', color: 'bg-violet-500' },
  CREATE_INVOICE: { label: 'Create Invoice', color: 'bg-indigo-500' },
  THIS_MONTH: { label: 'This Month', color: 'bg-blue-500' },
  DELAYED: { label: 'Delayed', color: 'bg-orange-500' },
  ON_HOLD: { label: 'On Hold', color: 'bg-gray-400' },
  FAIL: { label: 'Fail', color: 'bg-red-500' },
};

export function buildFinanceDashboardData(summary: FinanceDashboardSummary): FinanceDashboardData {
  return {
    totalRevenue: toAmount(summary.kpis.totalRevenue),
    outstandingAmount: toAmount(summary.kpis.outstandingAmount),
    overdueAmount: toAmount(summary.kpis.overdueAmount),
    monthlyRecurringRevenue: toAmount(summary.kpis.monthlyRecurringRevenue),
    reconciliation: summary.reconciliation,
    invoiceStatusItems: buildInvoiceStatusItems(summary),
    recentPayments: buildRecentPayments(summary),
    upcomingInvoices: buildUpcomingInvoices(summary),
  };
}

function buildInvoiceStatusItems(summary: FinanceDashboardSummary): InvoiceStatusItem[] {
  const totalInvoices = summary.invoiceStatusItems.reduce((sum, item) => sum + item.count, 0) || 1;

  return Object.entries(INVOICE_STATUS_META)
    .map(([status, meta]) => {
      const statusGroup = summary.invoiceStatusItems.find((item) => item.status === status);

      return {
        label: meta.label,
        count: statusGroup?.count ?? 0,
        amount: toAmount(statusGroup?.amount),
        color: meta.color,
        pct: Math.round(((statusGroup?.count ?? 0) / totalInvoices) * 100),
      };
    })
    .filter((item) => item.count > 0);
}

function buildRecentPayments(summary: FinanceDashboardSummary): RecentPaymentItem[] {
  return [...summary.recentPayments]
    .sort((left, right) => right.paymentDate.localeCompare(left.paymentDate))
    .map((payment) => ({
      id: payment.id,
      client: payment.company?.name ?? payment.project?.name ?? 'Unknown client',
      invoice: payment.invoice?.code ?? 'Unknown invoice',
      amount: toAmount(payment.amount),
      dateLabel: formatRelativeDate(payment.paymentDate),
    }));
}

function buildUpcomingInvoices(summary: FinanceDashboardSummary): UpcomingInvoiceItem[] {
  return summary.upcomingInvoices
    .filter((invoice) => invoice.dueDate)
    .map((invoice) => {
      const dueDate = invoice.dueDate as string;
      return {
        id: invoice.id,
        invoice: invoice.code,
        client: invoice.company?.name ?? 'Unknown client',
        amount: toAmount(invoice.amount),
        dueDateLabel: new Date(dueDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        daysLeft: getDaysLeft(dueDate),
      };
    })
    .sort((left, right) => left.daysLeft - right.daysLeft);
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toAmount(value: string | number | null | undefined): number {
  return Number(value ?? 0);
}

function formatRelativeDate(dateValue: string): string {
  const target = new Date(dateValue);
  const today = startOfToday();
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.round((today.getTime() - targetDay.getTime()) / MS_PER_DAY);

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return '1d ago';
  return `${diffDays}d ago`;
}

function getDaysLeft(dueDate: string): number {
  const target = new Date(dueDate);
  const today = startOfToday();
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.ceil((targetDay.getTime() - today.getTime()) / MS_PER_DAY);
}
