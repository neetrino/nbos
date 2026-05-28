import { Decimal, type PrismaClient } from '@nbos/database';
import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import {
  CLOSED_DELIVERY_STATUSES,
  DELIVERY_BONUS_ORDER_TYPES,
  type DeliveryPayableUnitDto,
  type DeliveryUnitInclusionReason,
} from './delivery-payable-unit.types';

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
  type: string;
  product: { name: string } | null;
  extension: { name: string } | null;
}): string {
  if (order.product) return order.product.name;
  if (order.extension) return order.extension.name;
  return order.code;
}

function pickReason(flags: {
  deliveryOpen: boolean;
  unpaid: boolean;
  pinned: boolean;
  inRun: boolean;
}): DeliveryUnitInclusionReason {
  if (flags.pinned) return 'PINNED';
  if (flags.inRun) return 'IN_THIS_PAYROLL_RUN';
  if (flags.deliveryOpen) return 'DELIVERY_OPEN';
  if (flags.unpaid) return 'UNPAID_BONUS';
  return 'DELIVERY_OPEN';
}

/** Resolves delivery payable units visible in a payroll run allocation matrix. */
export async function resolveDeliveryPayableUnits(
  prisma: InstanceType<typeof PrismaClient>,
  payrollRunId: string,
  pinnedUnitIds: string[],
): Promise<DeliveryPayableUnitDto[]> {
  const pinnedSet = new Set(pinnedUnitIds);

  const [runReleaseOrderIds, candidateOrders] = await Promise.all([
    prisma.bonusRelease
      .findMany({
        where: {
          payrollRunId,
          status: { in: ['DRAFT', 'APPROVED', 'INCLUDED_IN_PAYROLL', 'PAID'] },
        },
        select: { bonusEntry: { select: { orderId: true } } },
      })
      .then((rows) => new Set(rows.map((r) => r.bonusEntry.orderId))),
    prisma.order.findMany({
      where: { type: { in: [...DELIVERY_BONUS_ORDER_TYPES] } },
      select: {
        id: true,
        code: true,
        type: true,
        projectId: true,
        productId: true,
        extensionId: true,
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
        bonusEntries: { select: { amount: true, status: true } },
      },
    }),
  ]);

  const units: DeliveryPayableUnitDto[] = [];

  for (const order of candidateOrders) {
    const pool = order.productBonusPool;
    const planned = pool
      ? decimalFrom(pool.totalPlannedAmount)
      : order.bonusEntries.reduce((s, e) => s.plus(decimalFrom(e.amount)), BONUS_POOL_ZERO);
    const remaining = pool
      ? decimalFrom(pool.totalRemainingAmount)
      : order.bonusEntries
          .filter((e) => e.status !== 'PAID' && e.status !== 'CLAWBACK')
          .reduce((s, e) => s.plus(decimalFrom(e.amount)), BONUS_POOL_ZERO);

    const deliveryOpen = isDeliveryOpen(order.product?.status, order.extension?.status);
    const unpaid = remaining.gt(BONUS_POOL_ZERO);
    const pinned = pinnedSet.has(order.id);
    const inRun = runReleaseOrderIds.has(order.id);

    if (!deliveryOpen && !unpaid && !pinned && !inRun) {
      continue;
    }

    units.push({
      orderId: order.id,
      orderCode: order.code,
      orderType: order.type as 'PRODUCT' | 'EXTENSION',
      projectId: order.projectId,
      projectCode: order.project.code,
      label: unitLabel(order),
      productId: order.productId,
      extensionId: order.extensionId,
      deliveryOpen,
      totalPlannedBonus: planned.toFixed(2),
      totalReleasedBonus: pool ? decimalFrom(pool.totalReleasedAmount).toFixed(2) : '0.00',
      totalPaidBonus: pool ? decimalFrom(pool.totalPaidAmount).toFixed(2) : '0.00',
      totalRemainingBonus: remaining.toFixed(2),
      availableFunding: pool ? decimalFrom(pool.availableFunding).toFixed(2) : '0.00',
      overFundingAmount: pool ? decimalFrom(pool.overFundingAmount).toFixed(2) : '0.00',
      inclusionReason: pickReason({ deliveryOpen, unpaid, pinned, inRun }),
    });
  }

  units.sort((a, b) => a.label.localeCompare(b.label));
  return units;
}

/** Employee ids linked to a delivery unit via product roles or bonus entries. */
export function linkedEmployeeIdsForUnit(order: {
  product: { pmId: string | null; developerId: string | null; designerId: string | null } | null;
  bonusEmployeeIds: string[];
}): Set<string> {
  const ids = new Set(order.bonusEmployeeIds);
  if (order.product?.pmId) ids.add(order.product.pmId);
  if (order.product?.developerId) ids.add(order.product.developerId);
  if (order.product?.designerId) ids.add(order.product.designerId);
  return ids;
}

export function decimalGtZero(value: string | Decimal): boolean {
  return decimalFrom(value).gt(BONUS_POOL_ZERO);
}
