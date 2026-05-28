import { Decimal, PrismaClient } from '@nbos/database';
import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';

/** Sum non-cancelled invoice amounts linked to an order. */
export async function sumInvoicedForOrder(
  prisma: InstanceType<typeof PrismaClient>,
  orderId: string,
): Promise<Decimal> {
  const agg = await prisma.invoice.aggregate({
    where: { orderId, moneyStatus: { not: 'CANCELLED' } },
    _sum: { amount: true },
  });
  return decimalFrom(agg._sum.amount);
}

/** Invoiced minus payments received (floor at zero). */
export function computeReceivableAmount(invoiced: Decimal, received: Decimal): Decimal {
  return Decimal.max(BONUS_POOL_ZERO, invoiced.minus(received));
}
