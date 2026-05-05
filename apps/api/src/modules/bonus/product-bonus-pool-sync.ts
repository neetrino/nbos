import {
  Decimal,
  PrismaClient,
  type BonusReleaseStatusEnum,
  type ProductBonusPoolStatusEnum,
} from '@nbos/database';

const ZERO = new Decimal(0);

/** Amounts in these release statuses count toward `ProductBonusPool.totalReleasedAmount`. */
const RELEASE_STATUSES_FOR_POOL: BonusReleaseStatusEnum[] = [
  'APPROVED',
  'INCLUDED_IN_PAYROLL',
  'PAID',
];

/**
 * Upserts `ProductBonusPool` for an order from `BonusEntry` rows (planned / paid proxy)
 * and `BonusRelease` rows (released totals).
 */
export async function syncProductBonusPoolForOrder(
  prisma: InstanceType<typeof PrismaClient>,
  orderId: string,
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, projectId: true, productId: true, extensionId: true },
  });
  if (!order) return;

  const [plannedAgg, paidAgg, releasedAgg] = await Promise.all([
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
        status: { in: RELEASE_STATUSES_FOR_POOL },
        bonusEntry: { orderId },
      },
      _sum: { amount: true },
    }),
  ]);

  const planned = decimalFrom(plannedAgg._sum.amount);
  const paidProxy = decimalFrom(paidAgg._sum.amount);
  const released = decimalFrom(releasedAgg._sum.amount);
  const remaining = planned.minus(released);
  const poolStatus = derivePoolStatus(planned, released, remaining);

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
      availableFunding: ZERO,
      overFundingAmount: ZERO,
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
      status: poolStatus,
    },
  });
}

export function decimalFrom(value: Decimal | number | string | null | undefined): Decimal {
  if (value == null) return ZERO;
  if (value instanceof Decimal) return value;
  return new Decimal(value);
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
