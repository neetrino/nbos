import { PrismaClient } from '@nbos/database';
import { orderWhereForPoolKey } from './bonus-pool-key';
import { decimalFrom } from './bonus-pool-decimal';
import { sumPaymentsReceivedForOrder } from './order-received-payments-sum';
import { BONUS_RELEASE_COUNTING_STATUSES } from './product-bonus-pool.constants';
import { tryCreateProportionalAutoReleases } from './product-bonus-pool-auto-release';
import { syncProductBonusPoolForOrder } from './product-bonus-pool-sync';

export type BonusPoolAutoReleaseResultDto = {
  poolKey: string;
  orderIds: string[];
  ordersProcessed: number;
  /** True when at least one order received new AUTO releases. */
  releasesCreated: boolean;
};

/**
 * Manually runs delivery-side proportional AUTO releases for every order in a pool
 * (same rules as pool sync — product/extension DONE + funded budget).
 */
export async function triggerPoolProportionalAutoRelease(
  prisma: InstanceType<typeof PrismaClient>,
  poolKey: string,
): Promise<BonusPoolAutoReleaseResultDto> {
  const orders = await prisma.order.findMany({
    where: orderWhereForPoolKey(poolKey),
    select: {
      id: true,
      projectId: true,
      productId: true,
      extensionId: true,
      product: { select: { status: true } },
      extension: { select: { status: true } },
    },
  });

  let releasesCreated = false;

  for (const order of orders) {
    const [received, releasedAgg] = await Promise.all([
      sumPaymentsReceivedForOrder(prisma, order.id),
      prisma.bonusRelease.aggregate({
        where: {
          status: { in: BONUS_RELEASE_COUNTING_STATUSES },
          bonusEntry: { orderId: order.id },
        },
        _sum: { amount: true },
      }),
    ]);

    const released = decimalFrom(releasedAgg._sum.amount);
    const added = await tryCreateProportionalAutoReleases(prisma, {
      order,
      received,
      released,
    });

    if (added) {
      releasesCreated = true;
      await syncProductBonusPoolForOrder(prisma, order.id);
    }
  }

  return {
    poolKey,
    orderIds: orders.map((o) => o.id),
    ordersProcessed: orders.length,
    releasesCreated,
  };
}
