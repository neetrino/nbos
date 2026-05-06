import { sumAmounts, type FinanceAmountCarrier } from '../finance/finance-status.utils';
import type { MarketingDashboardPeriodRange } from './marketing-dashboard-period';

export interface MarketingDashboardWarning {
  code: string;
  message: string;
  count: number;
}

export interface DealPaymentRow extends FinanceAmountCarrier {
  paymentDate: Date;
}

export interface DashboardDealRow {
  status: string;
  createdAt: Date;
  orders: Array<{ invoices: Array<{ payments: DealPaymentRow[] }> }>;
}

export function sumBudget(activities: Array<{ budget: unknown }>): number {
  return activities.reduce((sum, activity) => sum + Number(activity.budget ?? 0), 0);
}

export function sumPaidRevenue(
  deals: DashboardDealRow[],
  period?: MarketingDashboardPeriodRange,
): number {
  return deals.reduce((dealSum, deal) => {
    const dealPayments = deal.orders.flatMap((order) =>
      order.invoices.flatMap((invoice) => invoice.payments),
    );
    const scoped = period
      ? dealPayments.filter(
          (p) => p.paymentDate >= period.dateFrom && p.paymentDate <= period.dateTo,
        )
      : dealPayments;
    return dealSum + sumAmounts(scoped);
  }, 0);
}

export function countAttributedDeals(
  deals: DashboardDealRow[],
  period?: MarketingDashboardPeriodRange,
) {
  if (!period) {
    return deals.length;
  }
  return deals.filter((d) => d.createdAt >= period.dateFrom && d.createdAt <= period.dateTo).length;
}

export function countWonAttributedDeals(
  deals: DashboardDealRow[],
  period?: MarketingDashboardPeriodRange,
) {
  if (!period) {
    return deals.filter((deal) => deal.status === 'WON').length;
  }
  return deals.filter((deal) => deal.status === 'WON' && paymentsInPeriodTotal(deal, period) > 0)
    .length;
}

function paymentsInPeriodTotal(deal: DashboardDealRow, period: MarketingDashboardPeriodRange) {
  const payments = deal.orders.flatMap((order) =>
    order.invoices.flatMap((invoice) => invoice.payments),
  );
  const scoped = payments.filter(
    (p) => p.paymentDate >= period.dateFrom && p.paymentDate <= period.dateTo,
  );
  return sumAmounts(scoped);
}

export function buildWarnings({
  missingAccountFinanceLinks,
  missingActivityFinanceLinks,
  missingFinanceLinks,
  paidMarketingSpend,
  paidRevenue,
  wonAttributedDeals,
}: {
  missingAccountFinanceLinks: number;
  missingActivityFinanceLinks: number;
  missingFinanceLinks: number;
  paidMarketingSpend: number;
  paidRevenue: number;
  wonAttributedDeals: number;
}): MarketingDashboardWarning[] {
  const noPaidSpendWarning =
    paidMarketingSpend <= 0 && paidRevenue > 0
      ? warning(
          'NO_PAID_MARKETING_SPEND',
          1,
          'Attributed revenue exists but no paid marketing spend is recorded in Finance for linked plans/cards.',
        )
      : null;
  const noWonDealsWarning =
    paidMarketingSpend > 0 && wonAttributedDeals === 0
      ? warning(
          'NO_WON_ATTRIBUTED_DEALS',
          1,
          'Paid marketing spend exists but no won attributed deals are present.',
        )
      : null;

  return [
    warning(
      'MISSING_ACCOUNT_FINANCE_LINKS',
      missingAccountFinanceLinks,
      'Marketing accounts are missing Finance Expense Plan links.',
    ),
    warning(
      'MISSING_ACTIVITY_EXPENSE_LINKS',
      missingActivityFinanceLinks,
      'Paid marketing activities are missing Finance expense cards.',
    ),
    missingFinanceLinks > 0
      ? warning(
          'EFFICIENCY_PARTIAL_DATA',
          missingFinanceLinks,
          'Some marketing rows are missing Finance links; paid spend may not include every campaign or List.am plan.',
        )
      : null,
    noPaidSpendWarning,
    noWonDealsWarning,
  ].filter((item): item is MarketingDashboardWarning => item !== null);
}

export function buildEfficiency({
  paidMarketingSpend,
  paidRevenue,
  wonAttributedDeals,
  attributedLeads,
  missingFinanceLinks,
}: {
  paidMarketingSpend: number;
  paidRevenue: number;
  wonAttributedDeals: number;
  attributedLeads: number;
  missingFinanceLinks: number;
}) {
  const hasPaidSpend = paidMarketingSpend > 0;
  const roas = hasPaidSpend ? paidRevenue / paidMarketingSpend : null;
  const costPerWonDeal =
    hasPaidSpend && wonAttributedDeals > 0 ? paidMarketingSpend / wonAttributedDeals : null;
  const costPerAttributedLead =
    hasPaidSpend && attributedLeads > 0 ? paidMarketingSpend / attributedLeads : null;

  if (!hasPaidSpend) {
    return {
      roas,
      costPerWonDeal,
      costPerAttributedLead,
      isReliable: false,
      reason: 'No paid marketing spend recorded',
    };
  }

  if (missingFinanceLinks > 0) {
    return {
      roas: null,
      costPerWonDeal: null,
      costPerAttributedLead: null,
      isReliable: false,
      reason: 'Missing Finance links; ROI and CPL stay hidden until coverage is complete',
    };
  }

  return { roas, costPerWonDeal, costPerAttributedLead, isReliable: true, reason: null };
}

function warning(code: string, count: number, message: string): MarketingDashboardWarning | null {
  return count > 0 ? { code, count, message } : null;
}
