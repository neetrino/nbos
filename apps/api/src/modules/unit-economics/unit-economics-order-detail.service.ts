import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import { sumPaymentsReceivedForOrder } from '../bonus/order-received-payments-sum';
import { DELIVERY_BONUS_ORDER_TYPES } from '../payroll-runs/delivery-payable-unit.types';
import { computeUnitEconomicsMoney, poolSnapshotFromRow } from './compute-unit-economics-money';
import { loadUnitEconomicsOrderBonusBreakdown } from './load-unit-economics-order-bonus-breakdown';
import { loadUnitEconomicsOrderBonuses } from './load-unit-economics-order-bonuses';
import { loadUnitEconomicsOrderExpenses } from './load-unit-economics-order-expenses';
import { computeReceivableAmount, sumInvoicedForOrder } from './order-invoice-totals';
import type {
  UnitEconomicsOrderDetailDto,
  UnitEconomicsPaymentLineDto,
} from './unit-economics.types';

function unitLabel(order: {
  code: string;
  product: { name: string } | null;
  extension: { name: string } | null;
}): string {
  if (order.product) return order.product.name;
  if (order.extension) return order.extension.name;
  return order.code;
}

function sumPaymentsOnInvoice(payments: { amount: Decimal }[]): Decimal {
  return payments.reduce((sum, p) => sum.plus(decimalFrom(p.amount)), BONUS_POOL_ZERO);
}

@Injectable()
export class UnitEconomicsOrderDetailService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getByOrderId(orderId: string): Promise<UnitEconomicsOrderDetailDto> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, type: { in: [...DELIVERY_BONUS_ORDER_TYPES] } },
      select: {
        id: true,
        code: true,
        type: true,
        product: { select: { id: true, name: true } },
        extension: { select: { id: true, name: true } },
        projectId: true,
        project: { select: { code: true, name: true } },
        productBonusPool: {
          select: {
            totalPlannedAmount: true,
            totalReleasedAmount: true,
            totalPaidAmount: true,
            totalRemainingAmount: true,
          },
        },
      },
    });
    if (!order) {
      throw new NotFoundException('Delivery unit not found');
    }

    const label = unitLabel(order);
    const [invoiced, received, expenses, bonuses, bonusBreakdown, invoiceRows] = await Promise.all([
      sumInvoicedForOrder(this.prisma, orderId),
      sumPaymentsReceivedForOrder(this.prisma, orderId),
      loadUnitEconomicsOrderExpenses(this.prisma, orderId),
      loadUnitEconomicsOrderBonuses(this.prisma, orderId),
      loadUnitEconomicsOrderBonusBreakdown(this.prisma, order, label),
      this.prisma.invoice.findMany({
        where: { orderId, moneyStatus: { not: 'CANCELLED' } },
        select: {
          id: true,
          code: true,
          amount: true,
          moneyStatus: true,
          type: true,
          dueDate: true,
          paidDate: true,
          payments: {
            select: { id: true, amount: true, paymentDate: true, paymentMethod: true },
            orderBy: { paymentDate: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const receivable = computeReceivableAmount(invoiced, received);
    const payments: UnitEconomicsPaymentLineDto[] = [];

    const invoices = invoiceRows.map((inv) => {
      const receivedOnInvoice = sumPaymentsOnInvoice(inv.payments);
      for (const payment of inv.payments) {
        payments.push({
          id: payment.id,
          invoiceId: inv.id,
          invoiceCode: inv.code,
          amount: decimalFrom(payment.amount).toFixed(2),
          paymentDate: payment.paymentDate.toISOString(),
          paymentMethod: payment.paymentMethod,
        });
      }
      return {
        id: inv.id,
        code: inv.code,
        amount: decimalFrom(inv.amount).toFixed(2),
        moneyStatus: inv.moneyStatus,
        type: inv.type,
        dueDate: inv.dueDate?.toISOString() ?? null,
        paidDate: inv.paidDate?.toISOString() ?? null,
        receivedOnInvoice: receivedOnInvoice.toFixed(2),
      };
    });

    payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    const expensesPaid = expenses.reduce(
      (sum, line) => sum.plus(decimalFrom(line.amount)),
      BONUS_POOL_ZERO,
    );
    const pool = order.productBonusPool ? poolSnapshotFromRow(order.productBonusPool) : null;
    const summary = computeUnitEconomicsMoney({
      invoiced,
      received,
      receivable,
      expensesPaid,
      pool,
    });

    return {
      orderId: order.id,
      orderCode: order.code,
      label,
      projectCode: order.project.code,
      projectId: order.projectId,
      orderType: order.type as 'PRODUCT' | 'EXTENSION',
      summary,
      invoices,
      payments,
      expenses,
      bonuses,
      bonusBreakdown,
    };
  }
}
