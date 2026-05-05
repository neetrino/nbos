import { Decimal, PrismaClient, type ProductBonusPoolStatusEnum } from '@nbos/database';
import { publishBonusEntryWalletHints } from '../employees/employee-wallet-notify.ops';
import type { WalletInAppNotifySink } from '../employees/employee-wallet-notify.types';
import { BONUS_POOL_ZERO, decimalFrom } from './bonus-pool-decimal';
import { tryCreateProportionalAutoReleases } from './product-bonus-pool-auto-release';
import { sumPaymentsReceivedForOrder } from './order-received-payments-sum';
import { BONUS_RELEASE_COUNTING_STATUSES } from './product-bonus-pool.constants';
import { syncBonusEntryStatusesForOrder } from './bonus-entry-status-sync';

export { decimalFrom } from './bonus-pool-decimal';

const ZERO = BONUS_POOL_ZERO;

/**
 * Upserts `ProductBonusPool` for an order from `BonusEntry` rows (planned / paid proxy)
 * and `BonusRelease` rows (released totals).
 */
export async function syncProductBonusPoolForOrder(
  prisma: InstanceType<typeof PrismaClient>,
  orderId: string,
  notify?: WalletInAppNotifySink,
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      projectId: true,
      productId: true,
      extensionId: true,
      product: { select: { status: true } },
      extension: { select: { status: true } },
    },
  });
  if (!order) return;

  const [plannedAgg, paidAgg, releasedAgg, received] = await Promise.all([
    prisma.bonusEntry.aggregate({
      where: { orderId },
      _sum: { amount: true },
    }),
    prisma.bonusEntry.aggregate({
      where: { orderId, status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.bonusRelease.aggregate({
      where: {
        status: { in: BONUS_RELEASE_COUNTING_STATUSES },
        bonusEntry: { orderId },
      },
      _sum: { amount: true },
    }),
    sumPaymentsReceivedForOrder(prisma, orderId),
  ]);

  const planned = decimalFrom(plannedAgg._sum.amount);
  const paidProxy = decimalFrom(paidAgg._sum.amount);
  let released = decimalFrom(releasedAgg._sum.amount);

  const autoAdded = await tryCreateProportionalAutoReleases(prisma, {
    order,
    received,
    released,
  });

  if (autoAdded) {
    const again = await prisma.bonusRelease.aggregate({
      where: {
        status: { in: BONUS_RELEASE_COUNTING_STATUSES },
        bonusEntry: { orderId },
      },
      _sum: { amount: true },
    });
    released = decimalFrom(again._sum.amount);
  }

  const remaining = planned.minus(released);
  const poolStatus = derivePoolStatus(planned, released, remaining);
  const availableFunding = Decimal.max(ZERO, received.minus(released));
  const overFundingAmount = Decimal.max(ZERO, released.minus(received));

  await prisma.productBonusPool.upsert({
    where: { orderId },
    create: {
      orderId: order.id,
      projectId: order.projectId,
      productId: order.productId,
      extensionId: order.extensionId,
      totalPlannedAmount: planned,
      totalReleasedAmount: released,
      totalPaidAmount: paidProxy,
      totalRemainingAmount: remaining,
      availableFunding,
      overFundingAmount,
      status: poolStatus,
    },
    update: {
      projectId: order.projectId,
      productId: order.productId,
      extensionId: order.extensionId,
      totalPlannedAmount: planned,
      totalReleasedAmount: released,
      totalPaidAmount: paidProxy,
      totalRemainingAmount: remaining,
      availableFunding,
      overFundingAmount,
      status: poolStatus,
    },
  });

  const hints = await syncBonusEntryStatusesForOrder(prisma, orderId);
  if (notify && hints.length > 0) {
    await publishBonusEntryWalletHints(notify, hints);
  }
}

function derivePoolStatus(
  planned: Decimal,
  released: Decimal,
  remaining: Decimal,
): ProductBonusPoolStatusEnum {
  if (planned.lte(0)) {
    return 'ACTIVE';
  }
  if (remaining.lte(0)) {
    return 'CLOSED';
  }
  if (released.gt(0)) {
    return 'PARTIALLY_RELEASED';
  }
  return 'ACTIVE';
}
