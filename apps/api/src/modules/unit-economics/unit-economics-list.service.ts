import { Injectable, Inject } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import { sumPaymentsReceivedForOrder } from '../bonus/order-received-payments-sum';
import { computeUnitEconomicsMoney, poolSnapshotFromRow } from './compute-unit-economics-money';
import {
  isUnitEconomicsOrderOpen,
  orderDisplayLabel,
  productGroupForOrder,
  UNIT_ECONOMICS_ORDER_TYPES,
  type UnitEconomicsOrderType,
} from './unit-economics-order.types';
import { computeReceivableAmount, sumInvoicedForOrder } from './order-invoice-totals';
import {
  rollupUnitEconomicsByProduct,
  rollupUnitEconomicsByProject,
} from './unit-economics-rollups';
import type { UnitEconomicsListDto, UnitEconomicsRowDto } from './unit-economics.types';

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
  return decimalFrom(agg._sum.functionalAmount).abs();
}

function hasActivity(
  pool: ReturnType<typeof poolSnapshotFromRow> | null,
  invoiced: Decimal,
  received: Decimal,
  expensesPaid: Decimal,
): boolean {
  if (pool && pool.planned.gt(BONUS_POOL_ZERO)) return true;
  return (
    invoiced.gt(BONUS_POOL_ZERO) || received.gt(BONUS_POOL_ZERO) || expensesPaid.gt(BONUS_POOL_ZERO)
  );
}

@Injectable()
export class UnitEconomicsListService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async list(): Promise<UnitEconomicsListDto> {
    const orders = await this.prisma.order.findMany({
      where: { type: { in: [...UNIT_ECONOMICS_ORDER_TYPES] } },
      select: {
        id: true,
        code: true,
        type: true,
        status: true,
        projectId: true,
        productId: true,
        extensionId: true,
        project: { select: { code: true, name: true } },
        deal: { select: { name: true, code: true, productType: true } },
        product: { select: { id: true, name: true, status: true } },
        extension: {
          select: {
            id: true,
            name: true,
            status: true,
            product: { select: { id: true, name: true } },
          },
        },
        productBonusPool: {
          select: {
            totalPlannedAmount: true,
            totalReleasedAmount: true,
            totalPaidAmount: true,
            totalRemainingAmount: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    const items: UnitEconomicsRowDto[] = [];
    const totalsAcc = {
      invoiced: BONUS_POOL_ZERO,
      received: BONUS_POOL_ZERO,
      receivable: BONUS_POOL_ZERO,
      expensesPaid: BONUS_POOL_ZERO,
      planned: BONUS_POOL_ZERO,
      cashBalance: BONUS_POOL_ZERO,
      outCommitted: BONUS_POOL_ZERO,
    };

    for (const order of orders) {
      const pool = order.productBonusPool ? poolSnapshotFromRow(order.productBonusPool) : null;
      const [invoiced, received, expensesPaid] = await Promise.all([
        sumInvoicedForOrder(this.prisma, order.id),
        sumPaymentsReceivedForOrder(this.prisma, order.id),
        sumExpensesPaidForOrder(this.prisma, order.id),
      ]);
      const receivable = computeReceivableAmount(invoiced, received);

      if (!hasActivity(pool, invoiced, received, expensesPaid)) {
        continue;
      }

      const money = computeUnitEconomicsMoney({
        invoiced,
        received,
        receivable,
        expensesPaid,
        pool,
      });

      totalsAcc.invoiced = totalsAcc.invoiced.plus(invoiced);
      totalsAcc.received = totalsAcc.received.plus(received);
      totalsAcc.receivable = totalsAcc.receivable.plus(receivable);
      totalsAcc.expensesPaid = totalsAcc.expensesPaid.plus(expensesPaid);
      totalsAcc.planned = totalsAcc.planned.plus(pool?.planned ?? BONUS_POOL_ZERO);
      totalsAcc.cashBalance = totalsAcc.cashBalance.plus(decimalFrom(money.cashBalance));
      totalsAcc.outCommitted = totalsAcc.outCommitted.plus(decimalFrom(money.outCommittedAmount));

      const label = orderDisplayLabel(order);
      const { productGroupId, productGroupName } = productGroupForOrder(order);
      items.push({
        orderId: order.id,
        orderCode: order.code,
        label,
        projectId: order.projectId,
        projectCode: order.project.code,
        projectName: order.project.name,
        productId: order.productId,
        extensionId: order.extensionId,
        productLabel: label,
        productGroupId,
        productGroupName,
        orderType: order.type as UnitEconomicsOrderType,
        deliveryOpen: isUnitEconomicsOrderOpen(
          order.type,
          order.status,
          order.product?.status,
          order.extension?.status,
        ),
        ...money,
      });
    }

    return {
      items,
      projects: rollupUnitEconomicsByProject(items),
      products: rollupUnitEconomicsByProduct(items),
      totals: {
        invoicedAmount: totalsAcc.invoiced.toFixed(2),
        receivedAmount: totalsAcc.received.toFixed(2),
        receivableAmount: totalsAcc.receivable.toFixed(2),
        expensesPaidAmount: totalsAcc.expensesPaid.toFixed(2),
        plannedBonuses: totalsAcc.planned.toFixed(2),
        cashBalance: totalsAcc.cashBalance.toFixed(2),
        outCommittedAmount: totalsAcc.outCommitted.toFixed(2),
      },
    };
  }
}
