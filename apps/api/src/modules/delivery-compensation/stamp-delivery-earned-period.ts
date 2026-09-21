import { PrismaClient } from '@nbos/database';
import { DELIVERY_BONUS_SOURCE_V2 } from '@nbos/shared';
import { earnedPeriodFromUtcDate } from '../bonus/sales-bonus-kpi-payable';

type Db = Pick<InstanceType<typeof PrismaClient>, 'bonusEntry'>;

type DbWithOrders = Db & Pick<InstanceType<typeof PrismaClient>, 'order'>;

/**
 * Stamps the earned month on V2 delivery entries of an order at the first Done.
 * Entries that already carry a period keep it, so early releases are never re-dated
 * and a repeated Done cannot move money into another payroll month.
 */
export async function stampDeliveryEarnedPeriodAtFirstDone(
  db: Db,
  params: { orderId: string; doneAt: Date },
): Promise<number> {
  const result = await db.bonusEntry.updateMany({
    where: {
      orderId: params.orderId,
      deliverySource: DELIVERY_BONUS_SOURCE_V2,
      earnedPeriod: null,
    },
    data: { earnedPeriod: earnedPeriodFromUtcDate(params.doneAt) },
  });
  return result.count;
}

/**
 * Stamps the earned month for a product inside the transaction that writes Done, so a failure
 * after the status write cannot leave a closed delivery whose bonus never enters payroll.
 */
export async function stampDeliveryEarnedPeriodForProduct(
  db: DbWithOrders,
  productId: string,
): Promise<number> {
  const order = await db.order.findUnique({ where: { productId }, select: { id: true } });
  if (!order) {
    return 0;
  }
  return stampDeliveryEarnedPeriodAtFirstDone(db, { orderId: order.id, doneAt: new Date() });
}

export async function stampDeliveryEarnedPeriodForExtension(
  db: DbWithOrders,
  extensionId: string,
): Promise<number> {
  const order = await db.order.findFirst({ where: { extensionId }, select: { id: true } });
  if (!order) {
    return 0;
  }
  return stampDeliveryEarnedPeriodAtFirstDone(db, { orderId: order.id, doneAt: new Date() });
}
