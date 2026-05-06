import { PrismaClient, type Prisma } from '@nbos/database';
import { sumAmounts } from '../finance/finance-status.utils';

interface MarketingDashboardWarning {
  code: string;
  message: string;
  count: number;
}

interface PaymentAmount {
  amount: number | string | { toNumber(): number } | null;
}

interface DashboardInputs {
  accounts: Array<{ financeExpensePlanId: string | null }>;
  activities: Array<{ budget: unknown; expenseCardId: string | null; status: string }>;
  deals: Array<{
    status: string;
    orders: Array<{ invoices: Array<{ payments: PaymentAmount[] }> }>;
  }>;
}

export interface MarketingDashboardSummary {
  totals: {
    accounts: number;
    activities: number;
    launchedActivities: number;
    activitiesWithFinanceExpense: number;
    missingFinanceLinks: number;
    attributedLeads: number;
    attributedDeals: number;
    wonAttributedDeals: number;
  };
  money: {
    plannedSpend: number;
    /** Sum of Finance `ExpensePayment` amounts for marketing-linked expense cards and expense plans. */
    paidMarketingSpend: number;
    /** True when `paidMarketingSpend > 0`; CPL/ROI-style metrics must only be shown when this is true. */
    roiMetricsAvailable: boolean;
    paidRevenue: number;
    netReturn: number | null;
    roas: number | null;
    costPerWonDeal: number | null;
    costPerAttributedLead: number | null;
  };
  efficiency: {
    isReliable: boolean;
    reason: string | null;
  };
  warnings: MarketingDashboardWarning[];
}

export async function getMarketingDashboardSummary(
  prisma: InstanceType<typeof PrismaClient>,
): Promise<MarketingDashboardSummary> {
  const [accounts, activities, deals, attributedLeads] = await Promise.all([
    prisma.marketingAccount.findMany({ select: { financeExpensePlanId: true } }),
    prisma.marketingActivity.findMany({
      select: { budget: true, expenseCardId: true, status: true },
    }),
    prisma.deal.findMany({
      where: {
        OR: [{ marketingAccountId: { not: null } }, { marketingActivityId: { not: null } }],
      },
      select: {
        status: true,
        orders: {
          select: {
            invoices: {
              select: {
                payments: { select: { amount: true } },
              },
            },
          },
        },
      },
    }),
    prisma.lead.count({
      where: {
        OR: [{ marketingAccountId: { not: null } }, { marketingActivityId: { not: null } }],
      },
    }),
  ]);

  const activityExpenseIds = uniqueIds(
    activities.map((a) => a.expenseCardId).filter((id): id is string => Boolean(id)),
  );
  const accountPlanIds = uniqueIds(
    accounts.map((a) => a.financeExpensePlanId).filter((id): id is string => Boolean(id)),
  );
  const paidMarketingSpend = await sumPaidMarketingSpend(
    prisma,
    activityExpenseIds,
    accountPlanIds,
  );

  return buildDashboardSummary({
    accounts,
    activities,
    deals,
    attributedLeads,
    paidMarketingSpend,
  });
}

interface DashboardBuildInput extends DashboardInputs {
  attributedLeads: number;
  paidMarketingSpend: number;
}

function buildDashboardSummary({
  accounts,
  activities,
  deals,
  attributedLeads,
  paidMarketingSpend,
}: DashboardBuildInput) {
  const missingAccountFinanceLinks = accounts.filter(
    (account) => !account.financeExpensePlanId,
  ).length;
  const missingActivityFinanceLinks = activities.filter(
    (activity) => Number(activity.budget ?? 0) > 0 && !activity.expenseCardId,
  ).length;

  const plannedSpend = sumBudget(activities);
  const paidRevenue = sumPaidRevenue(deals);
  const missingFinanceLinks = missingAccountFinanceLinks + missingActivityFinanceLinks;
  const wonAttributedDeals = deals.filter((deal) => deal.status === 'WON').length;
  const roiMetricsAvailable = paidMarketingSpend > 0;
  const efficiency = buildEfficiency({
    paidMarketingSpend,
    paidRevenue,
    wonAttributedDeals,
    attributedLeads,
    missingFinanceLinks,
  });

  return {
    totals: {
      accounts: accounts.length,
      activities: activities.length,
      launchedActivities: activities.filter((activity) => activity.status === 'LAUNCHED').length,
      activitiesWithFinanceExpense: activities.filter((activity) => Boolean(activity.expenseCardId))
        .length,
      missingFinanceLinks,
      attributedLeads,
      attributedDeals: deals.length,
      wonAttributedDeals,
    },
    money: {
      plannedSpend,
      paidMarketingSpend,
      roiMetricsAvailable,
      paidRevenue,
      netReturn: efficiency.isReliable ? paidRevenue - paidMarketingSpend : null,
      roas: efficiency.roas,
      costPerWonDeal: efficiency.costPerWonDeal,
      costPerAttributedLead: efficiency.costPerAttributedLead,
    },
    efficiency: {
      isReliable: efficiency.isReliable,
      reason: efficiency.reason,
    },
    warnings: buildWarnings({
      missingAccountFinanceLinks,
      missingActivityFinanceLinks,
      missingFinanceLinks,
      paidMarketingSpend,
      paidRevenue,
      wonAttributedDeals,
    }),
  };
}

function sumBudget(activities: Array<{ budget: unknown }>): number {
  return activities.reduce((sum, activity) => sum + Number(activity.budget ?? 0), 0);
}

function sumPaidRevenue(
  deals: Array<{ orders: Array<{ invoices: Array<{ payments: PaymentAmount[] }> }> }>,
): number {
  return deals.reduce((dealSum, deal) => {
    const dealPayments = deal.orders.flatMap((order) =>
      order.invoices.flatMap((invoice) => invoice.payments),
    );
    return dealSum + sumAmounts(dealPayments);
  }, 0);
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

async function sumPaidMarketingSpend(
  prisma: InstanceType<typeof PrismaClient>,
  activityExpenseIds: string[],
  accountPlanIds: string[],
): Promise<number> {
  const expenseOr: Prisma.ExpenseWhereInput[] = [];
  if (activityExpenseIds.length > 0) {
    expenseOr.push({ id: { in: activityExpenseIds } });
  }
  if (accountPlanIds.length > 0) {
    expenseOr.push({ expensePlanId: { in: accountPlanIds } });
  }
  if (expenseOr.length === 0) {
    return 0;
  }

  const agg = await prisma.expensePayment.aggregate({
    where: { expense: { OR: expenseOr } },
    _sum: { amount: true },
  });
  return Number(agg._sum.amount ?? 0);
}

function buildWarnings({
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

function buildEfficiency({
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
