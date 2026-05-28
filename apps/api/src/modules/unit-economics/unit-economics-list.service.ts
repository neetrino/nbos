import { Injectable, Inject } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import { sumPaymentsReceivedForOrder } from '../bonus/order-received-payments-sum';
import { computeReceivableAmount, sumInvoicedForOrder } from './order-invoice-totals';
import {
  CLOSED_DELIVERY_STATUSES,
  DELIVERY_BONUS_ORDER_TYPES,
} from '../payroll-runs/delivery-payable-unit.types';
import type { UnitEconomicsListDto, UnitEconomicsRowDto } from './unit-economics.types';

function isDeliveryOpen(
  productStatus: string | undefined,
  extensionStatus: string | undefined,
): boolean {
  if (
    productStatus &&
    !CLOSED_DELIVERY_STATUSES.includes(productStatus as (typeof CLOSED_DELIVERY_STATUSES)[number])
  ) {
    return true;
  }
  if (
    extensionStatus &&
    !CLOSED_DELIVERY_STATUSES.includes(extensionStatus as (typeof CLOSED_DELIVERY_STATUSES)[number])
  ) {
    return true;
  }
  return false;
}

function unitLabel(order: {
  code: string;
  product: { name: string } | null;
  extension: { name: string } | null;
}): string {
  if (order.product) return order.product.name;
  if (order.extension) return order.extension.name;
  return order.code;
}

async function sumExpensesPaidForOrder(
  prisma: InstanceType<typeof PrismaClient>,
  orderId: string,
): Promise<Decimal> {
  const agg = await prisma.operationalJournalEntry.aggregate({
    where: {
      orderId,
      sourceType: { in: ['EXPENSE_PAYMENT', 'EXPENSE_CARD'] },
      status: 'ACTIVE',
    },
    _sum: { functionalAmount: true },
  });
  return decimalFrom(agg._sum.functionalAmount);
}

@Injectable()
export class UnitEconomicsListService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async list(): Promise<UnitEconomicsListDto> {
    const orders = await this.prisma.order.findMany({
      where: { type: { in: [...DELIVERY_BONUS_ORDER_TYPES] } },
      select: {
        id: true,
        code: true,
        type: true,
        projectId: true,
        project: { select: { code: true } },
        product: { select: { name: true, status: true } },
        extension: { select: { name: true, status: true } },
        productBonusPool: {
          select: {
            totalPlannedAmount: true,
            totalReleasedAmount: true,
            totalPaidAmount: true,
            totalRemainingAmount: true,
            availableFunding: true,
            overFundingAmount: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    const items: UnitEconomicsRowDto[] = [];
    let totalInvoiced = BONUS_POOL_ZERO;
    let totalReceived = BONUS_POOL_ZERO;
    let totalReceivable = BONUS_POOL_ZERO;
    let totalExpenses = BONUS_POOL_ZERO;
    let totalPlanned = BONUS_POOL_ZERO;
    let totalAvailable = BONUS_POOL_ZERO;

    for (const order of orders) {
      const pool = order.productBonusPool;
      const [invoiced, received, expensesPaid] = await Promise.all([
        sumInvoicedForOrder(this.prisma, order.id),
        sumPaymentsReceivedForOrder(this.prisma, order.id),
        sumExpensesPaidForOrder(this.prisma, order.id),
      ]);
      const receivable = computeReceivableAmount(invoiced, received);

      const planned = pool ? decimalFrom(pool.totalPlannedAmount) : BONUS_POOL_ZERO;
      const released = pool ? decimalFrom(pool.totalReleasedAmount) : BONUS_POOL_ZERO;
      const paid = pool ? decimalFrom(pool.totalPaidAmount) : BONUS_POOL_ZERO;
      const remaining = pool ? decimalFrom(pool.totalRemainingAmount) : BONUS_POOL_ZERO;
      const available = pool ? decimalFrom(pool.availableFunding) : BONUS_POOL_ZERO;
      const overFunding = pool ? decimalFrom(pool.overFundingAmount) : BONUS_POOL_ZERO;
      const margin = received.minus(expensesPaid).minus(released);

      if (
        !pool &&
        invoiced.lte(BONUS_POOL_ZERO) &&
        received.lte(BONUS_POOL_ZERO) &&
        expensesPaid.lte(BONUS_POOL_ZERO)
      ) {
        continue;
      }

      totalInvoiced = totalInvoiced.plus(invoiced);
      totalReceived = totalReceived.plus(received);
      totalReceivable = totalReceivable.plus(receivable);
      totalExpenses = totalExpenses.plus(expensesPaid);
      totalPlanned = totalPlanned.plus(planned);
      totalAvailable = totalAvailable.plus(available);

      items.push({
        orderId: order.id,
        orderCode: order.code,
        label: unitLabel(order),
        projectId: order.projectId,
        projectCode: order.project.code,
        orderType: order.type as 'PRODUCT' | 'EXTENSION',
        deliveryOpen: isDeliveryOpen(order.product?.status, order.extension?.status),
        invoicedAmount: invoiced.toFixed(2),
        receivedAmount: received.toFixed(2),
        receivableAmount: receivable.toFixed(2),
        expensesPaidAmount: expensesPaid.toFixed(2),
        plannedBonuses: planned.toFixed(2),
        releasedBonuses: released.toFixed(2),
        paidBonuses: paid.toFixed(2),
        remainingBonuses: remaining.toFixed(2),
        availableCash: available.toFixed(2),
        overFundingAmount: overFunding.toFixed(2),
        estimatedMargin: margin.toFixed(2),
      });
    }

    return {
      items,
      totals: {
        invoicedAmount: totalInvoiced.toFixed(2),
        receivedAmount: totalReceived.toFixed(2),
        receivableAmount: totalReceivable.toFixed(2),
        expensesPaidAmount: totalExpenses.toFixed(2),
        plannedBonuses: totalPlanned.toFixed(2),
        availableCash: totalAvailable.toFixed(2),
      },
    };
  }
}
