import { BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { CLASSIC_ORDER_FIRST_INVOICE_MIN_FRACTION } from './invoice-first-payment-minimums.constants';

export interface FirstInvoiceMinimumCheckInput {
  orderId?: string;
  subscriptionId?: string;
  amount: number;
}

/**
 * Enforces first-invoice floors: classic order ≥10% of order total; subscription ≥ monthly amount.
 * @see `docs/NBOS/03-Business-Logic/03-Bonus-Payroll-Logic.md` (first paid invoice) and finance invoice flow.
 */
export async function assertFirstInvoiceMinimums(
  prisma: InstanceType<typeof PrismaClient>,
  data: FirstInvoiceMinimumCheckInput,
): Promise<void> {
  if (data.orderId?.trim()) {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      select: { paymentType: true, totalAmount: true },
    });
    if (!order) {
      throw new BadRequestException(`Order ${data.orderId} not found`);
    }
    if (order.paymentType === 'CLASSIC') {
      const priorCount = await prisma.invoice.count({ where: { orderId: data.orderId } });
      if (priorCount === 0) {
        const total = Number(order.totalAmount);
        const minAmount = Math.ceil(total * CLASSIC_ORDER_FIRST_INVOICE_MIN_FRACTION);
        if (data.amount < minAmount) {
          throw new BadRequestException(
            `First invoice for a classic order must be at least ${minAmount} (10% of order total ${total})`,
          );
        }
      }
    }
  }

  if (data.subscriptionId?.trim()) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: data.subscriptionId },
      select: { amount: true },
    });
    if (!subscription) {
      throw new BadRequestException(`Subscription ${data.subscriptionId} not found`);
    }
    const priorCount = await prisma.invoice.count({
      where: { subscriptionId: data.subscriptionId },
    });
    if (priorCount === 0) {
      const minAmount = Number(subscription.amount);
      if (data.amount < minAmount) {
        throw new BadRequestException(
          `First subscription invoice must be at least the monthly amount (${minAmount})`,
        );
      }
    }
  }
}
