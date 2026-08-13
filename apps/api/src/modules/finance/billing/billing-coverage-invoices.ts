import type { PrismaClient } from '@nbos/database';
import type { SubscriptionCoverageInvoiceRow } from '../subscriptions/subscription-coverage-window';

type PrismaLike = Pick<InstanceType<typeof PrismaClient>, 'invoice'>;

/** Loads SUBSCRIPTION invoices for billing-month coverage dedup and term counting. */
export async function loadCoverageInvoicesBySubscription(
  prisma: PrismaLike,
  subscriptionIds: string[],
): Promise<Map<string, SubscriptionCoverageInvoiceRow[]>> {
  const bySubscriptionId = new Map<string, SubscriptionCoverageInvoiceRow[]>();
  if (subscriptionIds.length === 0) {
    return bySubscriptionId;
  }

  const rows = await prisma.invoice.findMany({
    where: {
      subscriptionId: { in: subscriptionIds },
      type: 'SUBSCRIPTION',
    },
    select: {
      subscriptionId: true,
      coverageStartMonth: true,
      coverageMonthCount: true,
      createdAt: true,
    },
  });

  for (const row of rows) {
    if (!row.subscriptionId) {
      continue;
    }
    const list = bySubscriptionId.get(row.subscriptionId) ?? [];
    list.push({
      type: 'SUBSCRIPTION',
      coverageStartMonth: row.coverageStartMonth,
      coverageMonthCount: row.coverageMonthCount,
      createdAt: row.createdAt,
    });
    bySubscriptionId.set(row.subscriptionId, list);
  }
  return bySubscriptionId;
}
