import type { Subscription } from '@/lib/api/subscriptions';
import type { ProjectSubscription } from '@/lib/api/projects';

/** Minimal subscription seed from product finance list row. */
export function buildProjectSubscriptionSeed(
  row: ProjectSubscription,
  projectId: string,
): Subscription {
  return {
    id: row.id,
    code: row.code,
    projectId,
    type: row.type,
    baseMonthlyAmount: row.baseMonthlyAmount,
    billingFrequency: 'MONTHLY',
    billingDay: row.billingDay,
    taxStatus: 'NO_VAT',
    status: row.status,
    billingStartDate: row.billingStartDate,
    notificationsEnabled: true,
    endDate: row.endDate,
    createdAt: row.billingStartDate,
    project: { id: projectId, code: '', name: '' },
    invoices: row.invoices.map((invoice) => ({
      id: invoice.id,
      code: invoice.code,
      moneyStatus: invoice.moneyStatus,
      amount: invoice.amount,
    })),
  };
}
