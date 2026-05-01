import { PrismaClient } from '@nbos/database';
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
    attributedDeals: number;
    wonAttributedDeals: number;
  };
  money: {
    plannedSpend: number;
    paidRevenue: number;
    netReturn: number;
    roas: number | null;
    costPerWonDeal: number | null;
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
  const [accounts, activities, deals] = await Promise.all([
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
  ]);

  return buildDashboardSummary({ accounts, activities, deals });
}

function buildDashboardSummary({ accounts, activities, deals }: DashboardInputs) {
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
  const efficiency = buildEfficiency({
    plannedSpend,
    paidRevenue,
    wonAttributedDeals,
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
      attributedDeals: deals.length,
      wonAttributedDeals,
    },
    money: {
      plannedSpend,
      paidRevenue,
      netReturn: paidRevenue - plannedSpend,
      roas: efficiency.roas,
      costPerWonDeal: efficiency.costPerWonDeal,
    },
    efficiency: {
      isReliable: efficiency.isReliable,
      reason: efficiency.reason,
    },
    warnings: buildWarnings({
      missingAccountFinanceLinks,
      missingActivityFinanceLinks,
      missingFinanceLinks,
      plannedSpend,
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

function buildWarnings({
  missingAccountFinanceLinks,
  missingActivityFinanceLinks,
  missingFinanceLinks,
  plannedSpend,
  paidRevenue,
  wonAttributedDeals,
}: {
  missingAccountFinanceLinks: number;
  missingActivityFinanceLinks: number;
  missingFinanceLinks: number;
  plannedSpend: number;
  paidRevenue: number;
  wonAttributedDeals: number;
}): MarketingDashboardWarning[] {
  const noSpendWarning =
    plannedSpend <= 0 && paidRevenue > 0
      ? warning('NO_SPEND_BASELINE', 1, 'Revenue exists but marketing spend baseline is missing.')
      : null;
  const noWonDealsWarning =
    plannedSpend > 0 && wonAttributedDeals === 0
      ? warning(
          'NO_WON_ATTRIBUTED_DEALS',
          1,
          'Spend exists but no won attributed deals are present.',
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
          'Efficiency metrics use partial spend data.',
        )
      : null,
    noSpendWarning,
    noWonDealsWarning,
  ].filter((item): item is MarketingDashboardWarning => item !== null);
}

function buildEfficiency({
  plannedSpend,
  paidRevenue,
  wonAttributedDeals,
  missingFinanceLinks,
}: {
  plannedSpend: number;
  paidRevenue: number;
  wonAttributedDeals: number;
  missingFinanceLinks: number;
}) {
  const roas = plannedSpend > 0 ? paidRevenue / plannedSpend : null;
  const costPerWonDeal =
    plannedSpend > 0 && wonAttributedDeals > 0 ? plannedSpend / wonAttributedDeals : null;

  if (missingFinanceLinks > 0) {
    return { roas, costPerWonDeal, isReliable: false, reason: 'Missing Finance links' };
  }

  if (plannedSpend <= 0) {
    return { roas, costPerWonDeal, isReliable: false, reason: 'Missing spend baseline' };
  }

  return { roas, costPerWonDeal, isReliable: true, reason: null };
}

function warning(code: string, count: number, message: string): MarketingDashboardWarning | null {
  return count > 0 ? { code, count, message } : null;
}
