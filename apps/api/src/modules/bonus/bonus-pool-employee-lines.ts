import { Decimal, PrismaClient, type BonusStatusEnum, type BonusTypeEnum } from '@nbos/database';
import { BONUS_RELEASE_COUNTING_STATUSES } from './product-bonus-pool.constants';
import { orderWhereForPoolKey } from './bonus-pool-key';
import { sumPoolLedgerFields } from './bonus-pool-funding-health';
import { computeAdvisoryKpiHeldAmount } from './bonus-pool-kpi-held';

const ZERO = new Decimal(0);

export type BonusPoolEmployeeLineDto = {
  employeeId: string;
  employeeName: string;
  role: string | null;
  bonusTypes: BonusTypeEnum[];
  entryCount: number;
  plannedAmount: string;
  pipelineAmount: string;
  releasedAmount: string;
  includedInPayrollAmount: string;
  paidAmount: string;
  remainingAmount: string;
  burnedAmount: string | null;
  carryOverAmount: string | null;
  suggestedReleaseAmount: string | null;
  kpiGatePassed: boolean | null;
  primaryStatus: BonusStatusEnum | null;
};

type EmployeeAcc = {
  employeeId: string;
  employeeName: string;
  role: string | null;
  bonusTypes: Set<BonusTypeEnum>;
  entryCount: number;
  planned: Decimal;
  pipeline: Decimal;
  paid: Decimal;
  released: Decimal;
  includedInPayroll: Decimal;
  kpiBurnedPersisted: Decimal;
  carryOverPersisted: Decimal;
  kpiGatePassed: boolean | null;
  statuses: BonusStatusEnum[];
};

function money(value: Decimal): string {
  return value.toFixed(2);
}

function mergeKpiGate(current: boolean | null, next: boolean | null | undefined): boolean | null {
  if (next == null) return current;
  if (current == null) return next;
  return current && next;
}

function pickPrimaryStatus(statuses: BonusStatusEnum[]): BonusStatusEnum | null {
  if (statuses.length === 0) return null;
  const priority: BonusStatusEnum[] = [
    'PAID',
    'ACTIVE',
    'VESTED',
    'PENDING_ELIGIBILITY',
    'EARNED',
    'INCOMING',
    'CLAWBACK',
  ];
  for (const p of priority) {
    if (statuses.includes(p)) return p;
  }
  return statuses[0] ?? null;
}

function suggestReleaseForEmployee(
  remaining: Decimal,
  poolRemaining: Decimal,
  poolAvailable: Decimal,
): Decimal {
  if (remaining.lte(0) || poolAvailable.lte(0) || poolRemaining.lte(0)) {
    return ZERO;
  }
  const share = remaining.div(poolRemaining).mul(poolAvailable);
  return Decimal.min(remaining, share).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Per-employee bonus breakdown for a product/extension/order pool (NBOS pool sheet).
 */
export async function queryBonusPoolEmployeeLines(
  prisma: InstanceType<typeof PrismaClient>,
  poolKey: string,
): Promise<{
  poolKey: string;
  orderIds: string[];
  orderCodes: string[];
  lines: BonusPoolEmployeeLineDto[];
}> {
  const orders = await prisma.order.findMany({
    where: orderWhereForPoolKey(poolKey),
    select: { id: true, code: true },
    orderBy: { code: 'asc' },
  });
  const orderIds = orders.map((o) => o.id);
  if (orderIds.length === 0) {
    return { poolKey, orderIds: [], orderCodes: [], lines: [] };
  }

  const [entries, releases, ledgers] = await Promise.all([
    prisma.bonusEntry.findMany({
      where: { orderId: { in: orderIds } },
      select: {
        employeeId: true,
        amount: true,
        status: true,
        type: true,
        kpiGatePassed: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
            position: true,
            role: { select: { name: true } },
          },
        },
      },
    }),
    prisma.bonusRelease.findMany({
      where: {
        bonusEntry: { orderId: { in: orderIds } },
        status: { in: BONUS_RELEASE_COUNTING_STATUSES },
      },
      select: {
        employeeId: true,
        amount: true,
        payrollIncludedAmount: true,
        kpiBurnedAmount: true,
        payrollCarryOverAmount: true,
        status: true,
      },
    }),
    prisma.productBonusPool.findMany({
      where: { orderId: { in: orderIds } },
      select: {
        totalPlannedAmount: true,
        totalReleasedAmount: true,
        totalRemainingAmount: true,
        availableFunding: true,
        overFundingAmount: true,
        status: true,
      },
    }),
  ]);

  const merged = sumPoolLedgerFields(ledgers);
  const poolRemaining = merged.remaining;
  const poolAvailable = merged.available;

  const byEmployee = new Map<string, EmployeeAcc>();

  for (const entry of entries) {
    const name = `${entry.employee.firstName} ${entry.employee.lastName}`.trim();
    let acc = byEmployee.get(entry.employeeId);
    if (!acc) {
      acc = {
        employeeId: entry.employeeId,
        employeeName: name,
        role: entry.employee.position ?? entry.employee.role.name,
        bonusTypes: new Set(),
        entryCount: 0,
        planned: ZERO,
        pipeline: ZERO,
        paid: ZERO,
        released: ZERO,
        includedInPayroll: ZERO,
        kpiBurnedPersisted: ZERO,
        carryOverPersisted: ZERO,
        kpiGatePassed: null,
        statuses: [],
      };
      byEmployee.set(entry.employeeId, acc);
    }
    acc.entryCount += 1;
    acc.planned = acc.planned.plus(entry.amount);
    acc.bonusTypes.add(entry.type);
    acc.kpiGatePassed = mergeKpiGate(acc.kpiGatePassed, entry.kpiGatePassed);
    acc.statuses.push(entry.status);
    if (entry.status === 'PAID') {
      acc.paid = acc.paid.plus(entry.amount);
    } else if (entry.status !== 'CLAWBACK') {
      acc.pipeline = acc.pipeline.plus(entry.amount);
    }
  }

  for (const rel of releases) {
    const acc = byEmployee.get(rel.employeeId);
    if (acc == null) {
      continue;
    }
    acc.released = acc.released.plus(rel.amount);
    if (rel.status === 'INCLUDED_IN_PAYROLL' || rel.status === 'PAID') {
      const inc = rel.payrollIncludedAmount ?? rel.amount;
      acc.includedInPayroll = acc.includedInPayroll.plus(inc);
    }
    if (rel.kpiBurnedAmount != null && rel.kpiBurnedAmount.gt(0)) {
      acc.kpiBurnedPersisted = acc.kpiBurnedPersisted.plus(rel.kpiBurnedAmount);
    }
    if (rel.payrollCarryOverAmount != null && rel.payrollCarryOverAmount.gt(0)) {
      acc.carryOverPersisted = acc.carryOverPersisted.plus(rel.payrollCarryOverAmount);
    }
  }

  const lines: BonusPoolEmployeeLineDto[] = [...byEmployee.values()]
    .map((acc) => {
      const remaining = Decimal.max(ZERO, acc.planned.minus(acc.released));
      const suggested = suggestReleaseForEmployee(remaining, poolRemaining, poolAvailable);
      const kpiHeld = computeAdvisoryKpiHeldAmount(acc.planned, acc.released, acc.kpiGatePassed);
      const burned = acc.kpiBurnedPersisted.gt(0)
        ? acc.kpiBurnedPersisted
        : kpiHeld != null
          ? kpiHeld
          : null;
      return {
        employeeId: acc.employeeId,
        employeeName: acc.employeeName,
        role: acc.role,
        bonusTypes: [...acc.bonusTypes],
        entryCount: acc.entryCount,
        plannedAmount: money(acc.planned),
        pipelineAmount: money(acc.pipeline),
        releasedAmount: money(acc.released),
        includedInPayrollAmount: money(acc.includedInPayroll),
        paidAmount: money(acc.paid),
        remainingAmount: money(remaining),
        burnedAmount: burned != null ? money(burned) : null,
        carryOverAmount: acc.carryOverPersisted.gt(0) ? money(acc.carryOverPersisted) : null,
        suggestedReleaseAmount: suggested.gt(0) ? money(suggested) : null,
        kpiGatePassed: acc.kpiGatePassed,
        primaryStatus: pickPrimaryStatus(acc.statuses),
      };
    })
    .sort((a, b) => b.plannedAmount.localeCompare(a.plannedAmount));

  return {
    poolKey,
    orderIds,
    orderCodes: orders.map((o) => o.code),
    lines,
  };
}

/** Exposed for tests — proportional slice of pool available funding. */
export function computeSuggestedReleaseAmount(
  employeeRemaining: Decimal,
  poolRemaining: Decimal,
  poolAvailable: Decimal,
): Decimal {
  return suggestReleaseForEmployee(employeeRemaining, poolRemaining, poolAvailable);
}
