import { Decimal, type PrismaClient } from '@nbos/database';
import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import { payrollBonusReleaseBase } from './payroll-bonus-release-base';
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

function entryPlannedAmount(
  entry: {
    type: string;
    amount: Decimal | string;
    payableAmount: Decimal | string | null;
    earnedPeriod: string | null;
  },
  payrollMonth: string,
): Decimal {
  return payrollBonusReleaseBase(
    {
      type: entry.type,
      amount: entry.amount,
      payableAmount: entry.payableAmount,
      earnedPeriod: entry.earnedPeriod,
    },
    payrollMonth,
  );
}

function entryRemainingAmount(
  entry: {
    type: string;
    amount: Decimal | string;
    payableAmount: Decimal | string | null;
    earnedPeriod: string | null;
    status: string;
  },
  payrollMonth: string,
): Decimal {
  if (entry.status === 'PAID' || entry.status === 'CLAWBACK') {
    return BONUS_POOL_ZERO;
  }
  return entryPlannedAmount(entry, payrollMonth);
}

/** Resolves delivery payable units visible in a payroll run allocation matrix. */
export async function resolveDeliveryPayableUnits(
  prisma: InstanceType<typeof PrismaClient>,
  payrollRunId: string,
  pinnedUnitIds: string[],
): Promise<DeliveryPayableUnitDto[]> {
  const pinnedSet = new Set(pinnedUnitIds);

  const [run, runReleaseOrderIds, candidateOrders] = await Promise.all([
    prisma.payrollRun.findUnique({
      where: { id: payrollRunId },
      select: { payrollMonth: true },
    }),
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
        bonusEntries: {
          select: {
            type: true,
            amount: true,
            payableAmount: true,
            earnedPeriod: true,
            status: true,
          },
        },
      },
    }),
  ]);

  const payrollMonth = run?.payrollMonth ?? '';
  const units: DeliveryPayableUnitDto[] = [];

  for (const order of candidateOrders) {
    const pool = order.productBonusPool;
    const entryPlanned = order.bonusEntries.reduce(
      (sum, entry) => sum.plus(entryPlannedAmount(entry, payrollMonth)),
      BONUS_POOL_ZERO,
    );
    const entryRemaining = order.bonusEntries.reduce(
      (sum, entry) => sum.plus(entryRemainingAmount(entry, payrollMonth)),
      BONUS_POOL_ZERO,
    );
    const planned = pool ? decimalFrom(pool.totalPlannedAmount) : entryPlanned;
    const remaining = pool ? decimalFrom(pool.totalRemainingAmount) : entryRemaining;

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

/** Product columns that carry a delivery role holder, one per compensated role. */
export const DELIVERY_ROLE_PRODUCT_SELECT = {
  pmId: true,
  developerId: true,
  frontendDeveloperId: true,
  designerId: true,
  qaLeadId: true,
  technicalSpecialistId: true,
} as const;

export type DeliveryRoleHolders = {
  pmId: string | null;
  developerId: string | null;
  frontendDeveloperId: string | null;
  designerId: string | null;
  qaLeadId: string | null;
  technicalSpecialistId: string | null;
};

/**
 * Employee ids linked to a delivery unit via product roles or bonus entries.
 * All six compensated roles count: QA and the technical specialist earn delivery
 * units too, so leaving them out would hide their rows in the payroll matrix.
 */
export function linkedEmployeeIdsForUnit(order: {
  product: DeliveryRoleHolders | null;
  bonusEmployeeIds: string[];
}): Set<string> {
  const ids = new Set(order.bonusEmployeeIds);
  for (const employeeId of deliveryRoleHolderIds(order.product)) {
    ids.add(employeeId);
  }
  return ids;
}

/** Non-empty role holder ids of a product, without duplicates. */
export function deliveryRoleHolderIds(product: DeliveryRoleHolders | null | undefined): string[] {
  if (!product) return [];
  const holders = [
    product.pmId,
    product.developerId,
    product.frontendDeveloperId,
    product.designerId,
    product.qaLeadId,
    product.technicalSpecialistId,
  ];
  return [...new Set(holders.filter((id): id is string => Boolean(id)))];
}

/** True when the employee holds any compensated delivery role on the product. */
export function holdsDeliveryRole(
  product: DeliveryRoleHolders | null | undefined,
  employeeId: string,
): boolean {
  return deliveryRoleHolderIds(product).includes(employeeId);
}

export function decimalGtZero(value: string | Decimal): boolean {
  return decimalFrom(value).gt(BONUS_POOL_ZERO);
}
