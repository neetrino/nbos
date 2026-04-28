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

  const missingAccountFinanceLinks = accounts.filter(
    (account) => !account.financeExpensePlanId,
  ).length;
  const missingActivityFinanceLinks = activities.filter(
    (activity) => Number(activity.budget ?? 0) > 0 && !activity.expenseCardId,
  ).length;

  return {
    totals: {
      accounts: accounts.length,
      activities: activities.length,
      launchedActivities: activities.filter((activity) => activity.status === 'LAUNCHED').length,
      activitiesWithFinanceExpense: activities.filter((activity) => Boolean(activity.expenseCardId))
        .length,
      missingFinanceLinks: missingAccountFinanceLinks + missingActivityFinanceLinks,
      attributedDeals: deals.length,
      wonAttributedDeals: deals.filter((deal) => deal.status === 'WON').length,
    },
    money: {
      plannedSpend: sumBudget(activities),
      paidRevenue: sumPaidRevenue(deals),
    },
    warnings: buildWarnings(missingAccountFinanceLinks, missingActivityFinanceLinks),
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

function buildWarnings(
  missingAccountFinanceLinks: number,
  missingActivityFinanceLinks: number,
): MarketingDashboardWarning[] {
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
  ].filter((item): item is MarketingDashboardWarning => item !== null);
}

function warning(code: string, count: number, message: string): MarketingDashboardWarning | null {
  return count > 0 ? { code, count, message } : null;
}
