import type { PrismaClient } from '@nbos/database';
import { FINANCE_BONUSES_MODULE } from '../compensation-profiles/finance-pay-access';
import type { NotificationService } from '../notifications/notification.service';
import type { SalesAccrualHoldReason } from './sales-bonus-accrual-hold';

const ALL_SCOPE = 'ALL';
const VIEW_ACTION = 'VIEW';
const COMPANY_WIDE_BONUS_VIEW = {
  scope: ALL_SCOPE,
  permission: { module: FINANCE_BONUSES_MODULE, action: VIEW_ACTION },
} as const;

type HoldNotifyDetails = {
  reason: SalesAccrualHoldReason;
  invoiceId: string;
  orderId?: string;
};

export async function notifyFinanceBonusViewersOfAccrualHold(
  prisma: InstanceType<typeof PrismaClient>,
  notifications: Pick<NotificationService, 'createMany'>,
  details: HoldNotifyDetails,
): Promise<void> {
  const recipients = await prisma.employee.findMany({
    where: {
      status: { not: 'TERMINATED' },
      role: { permissions: { some: COMPANY_WIDE_BONUS_VIEW } },
    },
    select: { id: true },
  });
  const recipientIds = recipients.map((row) => row.id);
  if (recipientIds.length === 0) {
    return;
  }
  await notifications.createMany({
    recipientIds,
    type: 'sales_bonus.accrual_held',
    title: 'Sales bonus accrual held',
    body: holdBody(details),
    entityType: 'invoice',
    entityId: details.invoiceId,
    sourceModule: 'bonus',
    dedupeKeyPrefix: 'sales_bonus.accrual_held',
    dedupeKeySuffix: `${details.reason}:${details.invoiceId}`,
  });
}

function holdBody(details: HoldNotifyDetails): string {
  const order = details.orderId ? ` on order ${details.orderId}` : '';
  return `Sales bonus for invoice ${details.invoiceId}${order} is held (${details.reason}).`;
}
