import { PrismaClient } from '@nbos/database';
import { orderWhereForPoolKey } from './bonus-pool-key';
import { syncProductBonusPoolForOrder } from './product-bonus-pool-sync';

export type BonusPoolSyncResultDto = {
  poolKey: string;
  orderIds: string[];
  ordersSynced: number;
};

/** Recomputes product bonus pool ledger rows from live payments for every order in the pool. */
export async function syncProductBonusPoolForPoolKey(
  prisma: InstanceType<typeof PrismaClient>,
  poolKey: string,
): Promise<BonusPoolSyncResultDto> {
  const orders = await prisma.order.findMany({
    where: orderWhereForPoolKey(poolKey),
    select: { id: true },
  });

  for (const order of orders) {
    await syncProductBonusPoolForOrder(prisma, order.id);
  }

  return {
    poolKey,
    orderIds: orders.map((order) => order.id),
    ordersSynced: orders.length,
  };
}
