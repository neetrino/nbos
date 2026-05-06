import { Decimal, PrismaClient } from '@nbos/database';
import { BONUS_POOL_ZERO, decimalFrom } from './bonus-pool-decimal';
import {
  BONUS_RELEASE_COUNTING_STATUSES,
  DELIVERY_AUTO_RELEASE_BONUS_TYPES,
} from './product-bonus-pool.constants';

type OrderForAutoRelease = {
  id: string;
  projectId: string;
  productId: string | null;
  extensionId: string | null;
  product: { status: string } | null;
  extension: { status: string } | null;
};

function isOrderProductDone(order: OrderForAutoRelease): boolean {
  if (order.extensionId && order.extension?.status === 'DONE') {
    return true;
  }
  if (order.productId && order.product?.status === 'DONE') {
    return true;
  }
  return false;
}

function splitProportional(alloc: Decimal, weights: Decimal[]): Decimal[] {
  const sumW = weights.reduce((acc, w) => acc.plus(w), BONUS_POOL_ZERO);
  if (sumW.lte(0)) {
    return weights.map(() => BONUS_POOL_ZERO);
  }
  const out: Decimal[] = [];
  let assigned = BONUS_POOL_ZERO;
  for (let i = 0; i < weights.length; i++) {
    if (i === weights.length - 1) {
      out.push(alloc.minus(assigned));
    } else {
      const rounded = alloc.mul(weights[i]).div(sumW).toDecimalPlaces(2, Decimal.ROUND_DOWN);
      out.push(rounded);
      assigned = assigned.plus(rounded);
    }
  }
  return out;
}

/**
 * When the product/extension is DONE and client payments fund it, creates proportional
 * `AUTO` / `APPROVED` bonus releases for delivery-side entries (NBOS).
 *
 * @returns true when at least one release row was inserted.
 */
export async function tryCreateProportionalAutoReleases(
  prisma: InstanceType<typeof PrismaClient>,
  params: {
    order: OrderForAutoRelease;
    received: Decimal;
    released: Decimal;
  },
): Promise<boolean> {
  const { order, received, released } = params;
  if (!isOrderProductDone(order)) {
    return false;
  }

  const budget = Decimal.max(BONUS_POOL_ZERO, received.minus(released));
  if (budget.lte(0)) {
    return false;
  }

  const entries = await prisma.bonusEntry.findMany({
    where: {
      orderId: order.id,
      type: { in: [...DELIVERY_AUTO_RELEASE_BONUS_TYPES] },
      status: { notIn: ['CLAWBACK', 'PAID'] },
    },
    select: { id: true, employeeId: true, projectId: true, amount: true },
  });

  if (entries.length === 0) {
    return false;
  }

  const entryIds = entries.map((e) => e.id);
  const grouped = await prisma.bonusRelease.groupBy({
    by: ['bonusEntryId'],
    where: {
      bonusEntryId: { in: entryIds },
      status: { in: BONUS_RELEASE_COUNTING_STATUSES },
    },
    _sum: { amount: true },
  });
  const releasedByEntry = new Map(
    grouped.map((g) => [g.bonusEntryId, decimalFrom(g._sum.amount)] as const),
  );

  const rows: { entry: (typeof entries)[0]; remaining: Decimal }[] = [];
  for (const entry of entries) {
    const prior = releasedByEntry.get(entry.id) ?? BONUS_POOL_ZERO;
    const rem = decimalFrom(entry.amount).minus(prior);
    if (rem.gt(0)) {
      rows.push({ entry, remaining: rem });
    }
  }

  if (rows.length === 0) {
    return false;
  }

  const sumRem = rows.reduce((acc, row) => acc.plus(row.remaining), BONUS_POOL_ZERO);
  const alloc = Decimal.min(budget, sumRem);
  if (alloc.lte(0)) {
    return false;
  }

  const shares = splitProportional(
    alloc,
    rows.map((r) => r.remaining),
  );
  const creates = rows
    .map((row, i) => ({ row, amount: shares[i] ?? BONUS_POOL_ZERO }))
    .filter((x) => x.amount.gt(0));

  if (creates.length === 0) {
    return false;
  }

  await prisma.$transaction(
    creates.map(({ row, amount }) =>
      prisma.bonusRelease.create({
        data: {
          bonusEntryId: row.entry.id,
          employeeId: row.entry.employeeId,
          projectId: row.entry.projectId,
          productId: order.productId,
          extensionId: order.extensionId,
          amount,
          releaseType: 'AUTO',
          status: 'APPROVED',
        },
      }),
    ),
  );

  return true;
}
