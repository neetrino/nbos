import { Decimal, type BonusStatusEnum } from '@nbos/database';

/** One cell from `bonusEntry.groupBy({ by: ['orderId', 'status'] })`. */
export interface BonusOrderPoolGroupRow {
  orderId: string;
  status: BonusStatusEnum;
  _count: number;
  _sum: { amount: Decimal | null };
}

export type BonusProductPoolKind = 'PRODUCT' | 'EXTENSION' | 'ORDER';

/** Serialized product/extension (or order fallback) roll-up — NBOS Product Bonus Pool aggregate. */
export interface BonusProductPoolRow {
  poolKey: string;
  poolKind: BonusProductPoolKind;
  /** Representative `Order.id` for this pool (joins to `product_bonus_pools`). */
  anchorOrderId: string;
  poolName: string;
  orderCode: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  entryCount: number;
  sumTotalAmount: string;
  sumPipelineAmount: string;
  sumPaidAmount: string;
  sumClawbackAmount: string;
  /** From `product_bonus_pools` when present (else null until synced). */
  ledgerPlannedAmount: string | null;
  ledgerReleasedAmount: string | null;
  ledgerRemainingAmount: string | null;
  ledgerAvailableFunding: string | null;
  ledgerPoolStatus: string | null;
}

export type OrderForBonusPool = {
  id: string;
  code: string;
  projectId: string;
  productId: string | null;
  extensionId: string | null;
  project: { id: string; code: string; name: string };
  product: { id: string; name: string } | null;
  extension: { id: string; name: string } | null;
};

const ZERO = new Decimal(0);

function toMoneyString(value: Decimal): string {
  return value.toFixed(2);
}

function decimalFrom(value: Decimal | number | string | null | undefined): Decimal {
  if (value == null) return ZERO;
  if (value instanceof Decimal) return value;
  return new Decimal(value);
}

function addDecimal(a: Decimal, b: Decimal | number | string | null | undefined): Decimal {
  return a.plus(decimalFrom(b));
}

type PoolAcc = {
  entryCount: number;
  pipeline: Decimal;
  paid: Decimal;
  clawback: Decimal;
};

function emptyAcc(): PoolAcc {
  return { entryCount: 0, pipeline: ZERO, paid: ZERO, clawback: ZERO };
}

function mergeRow(
  acc: PoolAcc,
  row: { status: BonusStatusEnum; _count: number; _sum: { amount: Decimal | null } },
): PoolAcc {
  const amount = row._sum.amount;
  const nextCount = acc.entryCount + row._count;
  if (row.status === 'PAID') {
    return {
      entryCount: nextCount,
      pipeline: acc.pipeline,
      paid: addDecimal(acc.paid, amount),
      clawback: acc.clawback,
    };
  }
  if (row.status === 'CLAWBACK') {
    return {
      entryCount: nextCount,
      pipeline: acc.pipeline,
      paid: acc.paid,
      clawback: addDecimal(acc.clawback, amount),
    };
  }
  return {
    entryCount: nextCount,
    pipeline: addDecimal(acc.pipeline, amount),
    paid: acc.paid,
    clawback: acc.clawback,
  };
}

function resolvePoolKey(order: OrderForBonusPool): {
  poolKey: string;
  poolKind: BonusProductPoolKind;
} {
  if (order.productId) {
    return { poolKey: `product:${order.productId}`, poolKind: 'PRODUCT' };
  }
  if (order.extensionId) {
    return { poolKey: `extension:${order.extensionId}`, poolKind: 'EXTENSION' };
  }
  return { poolKey: `order:${order.id}`, poolKind: 'ORDER' };
}

function resolvePoolName(order: OrderForBonusPool): string {
  if (order.product?.name) return order.product.name;
  if (order.extension?.name) return order.extension.name;
  return `Order ${order.code}`;
}

type PoolMeta = {
  poolKind: BonusProductPoolKind;
  anchorOrderId: string;
  poolName: string;
  orderCode: string;
  projectId: string;
  projectCode: string;
  projectName: string;
};

/**
 * Remaps order×status groups to product/extension/order pool keys, then folds pipeline/paid/clawback.
 */
export function foldBonusProductPools(
  orderGroups: readonly BonusOrderPoolGroupRow[],
  orders: readonly OrderForBonusPool[],
): BonusProductPoolRow[] {
  if (orderGroups.length === 0) {
    return [];
  }

  const orderById = new Map(orders.map((o) => [o.id, o] as const));
  const cells = new Map<string, Map<BonusStatusEnum, { count: number; sum: Decimal }>>();
  const poolMeta = new Map<string, PoolMeta>();

  for (const row of orderGroups) {
    const order = orderById.get(row.orderId);
    if (!order) continue;
    const { poolKey, poolKind } = resolvePoolKey(order);
    if (!poolMeta.has(poolKey)) {
      poolMeta.set(poolKey, {
        poolKind,
        anchorOrderId: order.id,
        poolName: resolvePoolName(order),
        orderCode: order.code,
        projectId: order.project.id,
        projectCode: order.project.code,
        projectName: order.project.name,
      });
    }
    const byStatus = cells.get(poolKey) ?? new Map();
    const prev = byStatus.get(row.status) ?? { count: 0, sum: ZERO };
    byStatus.set(row.status, {
      count: prev.count + row._count,
      sum: prev.sum.plus(decimalFrom(row._sum.amount)),
    });
    cells.set(poolKey, byStatus);
  }

  const result: BonusProductPoolRow[] = [];
  for (const [poolKey, byStatus] of cells) {
    const meta = poolMeta.get(poolKey);
    if (!meta) continue;
    let acc = emptyAcc();
    for (const [status, cell] of byStatus) {
      acc = mergeRow(acc, {
        status,
        _count: cell.count,
        _sum: { amount: cell.sum },
      });
    }
    const sumTotal = acc.pipeline.plus(acc.paid).plus(acc.clawback);
    result.push({
      poolKey,
      poolKind: meta.poolKind,
      anchorOrderId: meta.anchorOrderId,
      poolName: meta.poolName,
      orderCode: meta.orderCode,
      projectId: meta.projectId,
      projectCode: meta.projectCode,
      projectName: meta.projectName,
      entryCount: acc.entryCount,
      sumTotalAmount: toMoneyString(sumTotal),
      sumPipelineAmount: toMoneyString(acc.pipeline),
      sumPaidAmount: toMoneyString(acc.paid),
      sumClawbackAmount: toMoneyString(acc.clawback),
      ledgerPlannedAmount: null,
      ledgerReleasedAmount: null,
      ledgerRemainingAmount: null,
      ledgerAvailableFunding: null,
      ledgerPoolStatus: null,
    });
  }

  result.sort((a, b) => {
    const diff = Number.parseFloat(b.sumTotalAmount) - Number.parseFloat(a.sumTotalAmount);
    if (diff !== 0) return diff;
    return a.poolName.localeCompare(b.poolName);
  });
  return result;
}
