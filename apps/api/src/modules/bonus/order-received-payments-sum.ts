import { Decimal, PrismaClient } from '@nbos/database';
import { decimalFrom } from './bonus-pool-decimal';

/**
 * Sum of all `Payment` amounts on invoices linked to the order (Product Received Amount proxy).
 */
export async function sumPaymentsReceivedForOrder(
  prisma: InstanceType<typeof PrismaClient>,
  orderId: string,
): Promise<Decimal> {
  const agg = await prisma.payment.aggregate({
    where: { invoice: { orderId } },
    _sum: { amount: true },
  });
  return decimalFrom(agg._sum.amount);
}
