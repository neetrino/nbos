import { PrismaClient, type Prisma } from '@nbos/database';
import type { MarketingDashboardPeriodRange } from './marketing-dashboard-period';
import {
  buildEfficiency,
  buildWarnings,
  countAttributedDeals,
  countWonAttributedDeals,
  type DashboardDealRow,
  type MarketingDashboardWarning,
  sumBudget,
  sumPaidRevenue,
} from './marketing-dashboard-summary-helpers';

export type { MarketingDashboardWarning } from './marketing-dashboard-summary-helpers';

export interface MarketingDashboardSummary {
  /** When set, lead/deal counts (by creation), revenue, and spend are scoped to this range. */
  period: { dateFrom: string; dateTo: string } | null;
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

interface DashboardInputs {
  accounts: Array<{ financeExpensePlanId: string | null }>;
  activities: Array<{ budget: unknown; expenseCardId: string | null; status: string }>;
  deals: DashboardDealRow[];
}

export async function getMarketingDashboardSummary(
  prisma: InstanceType<typeof PrismaClient>,
  period?: MarketingDashboardPeriodRange,
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
        createdAt: true,
        orders: {
          select: {
            invoices: {
              select: {
                payments: { select: { amount: true, paymentDate: true } },
              },
            },
          },
        },
      },
    }),
    prisma.lead.count({
      where: {
        OR: [{ marketingAccountId: { not: null } }, { marketingActivityId: { not: null } }],
        ...(period
          ? {
              createdAt: {
                gte: period.dateFrom,
                lte: period.dateTo,
              },
            }
          : {}),
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
    period,
  );

  return buildDashboardSummary({
    accounts,
    activities,
    deals,
    attributedLeads,
    paidMarketingSpend,
    period,
  });
}

interface DashboardBuildInput extends DashboardInputs {
  attributedLeads: number;
  paidMarketingSpend: number;
  period?: MarketingDashboardPeriodRange;
}

function buildDashboardSummary({
  accounts,
  activities,
  deals,
  attributedLeads,
  paidMarketingSpend,
  period,
}: DashboardBuildInput): MarketingDashboardSummary {
  const missingAccountFinanceLinks = accounts.filter(
    (account) => !account.financeExpensePlanId,
  ).length;
  const missingActivityFinanceLinks = activities.filter(
    (activity) => Number(activity.budget ?? 0) > 0 && !activity.expenseCardId,
  ).length;

  const plannedSpend = sumBudget(activities);
  const paidRevenue = sumPaidRevenue(deals, period);
  const missingFinanceLinks = missingAccountFinanceLinks + missingActivityFinanceLinks;
  const wonAttributedDeals = countWonAttributedDeals(deals, period);
  const attributedDeals = countAttributedDeals(deals, period);
  const roiMetricsAvailable = paidMarketingSpend > 0;
  const efficiency = buildEfficiency({
    paidMarketingSpend,
    paidRevenue,
    wonAttributedDeals,
    attributedLeads,
    missingFinanceLinks,
  });

  return {
    period: period
      ? { dateFrom: period.dateFrom.toISOString(), dateTo: period.dateTo.toISOString() }
      : null,
    totals: {
      accounts: accounts.length,
      activities: activities.length,
      launchedActivities: activities.filter((activity) => activity.status === 'LAUNCHED').length,
      activitiesWithFinanceExpense: activities.filter((activity) => Boolean(activity.expenseCardId))
        .length,
      missingFinanceLinks,
      attributedLeads,
      attributedDeals,
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

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

async function sumPaidMarketingSpend(
  prisma: InstanceType<typeof PrismaClient>,
  activityExpenseIds: string[],
  accountPlanIds: string[],
  period?: MarketingDashboardPeriodRange,
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
    where: {
      expense: { OR: expenseOr },
      ...(period
        ? {
            paymentDate: {
              gte: period.dateFrom,
              lte: period.dateTo,
            },
          }
        : {}),
    },
    _sum: { amount: true },
  });
  return Number(agg._sum.amount ?? 0);
}
