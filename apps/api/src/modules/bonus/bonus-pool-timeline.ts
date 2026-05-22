import { PrismaClient } from '@nbos/database';
import { orderWhereForPoolKey } from './bonus-pool-key';
import { deriveBonusPoolFundingMetrics } from './bonus-pool-funding-health';
import { sumPoolLedgerFields } from './bonus-pool-funding-health';

export type BonusPoolTimelineEventKind = 'PAYMENT_IN' | 'RELEASE_OUT';

export type BonusPoolRiskFlag =
  | 'OVER_FUNDING'
  | 'UNDERFUNDED'
  | 'KPI_NOT_PASSED'
  | 'EARLY_RELEASE'
  | 'EXTRA_BONUS'
  | 'OVER_FUNDING_RELEASE';

export type BonusPoolTimelineEventDto = {
  id: string;
  kind: BonusPoolTimelineEventKind;
  occurredAt: string;
  amount: string;
  label: string;
  orderCode: string | null;
  employeeName: string | null;
  releaseType: string | null;
  releaseStatus: string | null;
};

export type BonusPoolTimelineDto = {
  poolKey: string;
  orderIds: string[];
  events: BonusPoolTimelineEventDto[];
  riskFlags: BonusPoolRiskFlag[];
};

function money(value: { toFixed: (n: number) => string }): string {
  return value.toFixed(2);
}

function buildRiskFlags(input: {
  overFunding: boolean;
  fundingHealth: string;
  remainingPositive: boolean;
  kpiNotPassed: boolean;
  releaseTypes: Set<string>;
}): BonusPoolRiskFlag[] {
  const flags: BonusPoolRiskFlag[] = [];
  if (input.overFunding) flags.push('OVER_FUNDING');
  if (input.fundingHealth === 'EMPTY' || input.fundingHealth === 'PARTIAL') {
    if (input.remainingPositive) flags.push('UNDERFUNDED');
  }
  if (input.kpiNotPassed) flags.push('KPI_NOT_PASSED');
  if (input.releaseTypes.has('EARLY')) flags.push('EARLY_RELEASE');
  if (input.releaseTypes.has('EXTRA')) flags.push('EXTRA_BONUS');
  if (input.releaseTypes.has('OVER_FUNDING')) flags.push('OVER_FUNDING_RELEASE');
  return flags;
}

/**
 * Funding timeline: client payments in and bonus releases out for a pool scope.
 */
export async function queryBonusPoolTimeline(
  prisma: InstanceType<typeof PrismaClient>,
  poolKey: string,
): Promise<BonusPoolTimelineDto> {
  const orders = await prisma.order.findMany({
    where: orderWhereForPoolKey(poolKey),
    select: { id: true, code: true },
  });
  const orderIds = orders.map((o) => o.id);
  const orderCodeById = new Map(orders.map((o) => [o.id, o.code] as const));

  if (orderIds.length === 0) {
    return { poolKey, orderIds: [], events: [], riskFlags: [] };
  }

  const [payments, releases, kpiRows, ledgers] = await Promise.all([
    prisma.payment.findMany({
      where: { invoice: { orderId: { in: orderIds } } },
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        invoice: { select: { orderId: true, code: true } },
      },
      orderBy: { paymentDate: 'desc' },
    }),
    prisma.bonusRelease.findMany({
      where: { bonusEntry: { orderId: { in: orderIds } } },
      select: {
        id: true,
        amount: true,
        releaseType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        payrollIncludedAmount: true,
        employee: { select: { firstName: true, lastName: true } },
        bonusEntry: { select: { orderId: true } },
        payrollRun: { select: { payrollMonth: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.bonusEntry.findMany({
      where: { orderId: { in: orderIds }, kpiGatePassed: false },
      select: { id: true },
      take: 1,
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

  const paymentEvents: BonusPoolTimelineEventDto[] = payments.map((p) => {
    const orderId = p.invoice.orderId;
    return {
      id: p.id,
      kind: 'PAYMENT_IN',
      occurredAt: p.paymentDate.toISOString(),
      amount: money(p.amount),
      label: p.invoice.code ? `Payment · ${p.invoice.code}` : 'Client payment',
      orderCode: orderId ? (orderCodeById.get(orderId) ?? null) : null,
      employeeName: null,
      releaseType: null,
      releaseStatus: null,
    };
  });

  const releaseEvents: BonusPoolTimelineEventDto[] = releases.map((r) => {
    const name = `${r.employee.firstName} ${r.employee.lastName}`.trim();
    const payrollMonth = r.payrollRun?.payrollMonth;
    const statusSuffix =
      r.status === 'PAID'
        ? ' · Paid'
        : r.status === 'INCLUDED_IN_PAYROLL' && payrollMonth
          ? ` · Payroll ${payrollMonth}`
          : r.status === 'INCLUDED_IN_PAYROLL'
            ? ' · In payroll'
            : '';
    const occurredAt = r.status === 'PAID' ? r.updatedAt : r.createdAt;
    const displayAmount = r.payrollIncludedAmount ?? r.amount;
    return {
      id: r.id,
      kind: 'RELEASE_OUT',
      occurredAt: occurredAt.toISOString(),
      amount: money(displayAmount),
      label: `Release · ${r.releaseType}${statusSuffix}`,
      orderCode: orderCodeById.get(r.bonusEntry.orderId) ?? null,
      employeeName: name,
      releaseType: r.releaseType,
      releaseStatus: r.status,
    };
  });

  const events = [...paymentEvents, ...releaseEvents].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  const merged = sumPoolLedgerFields(ledgers);
  const metrics = deriveBonusPoolFundingMetrics({
    planned: merged.planned,
    received: merged.received,
    available: merged.available,
    remaining: merged.remaining,
    overFunding: merged.overFunding,
    ledgerStatus: merged.ledgerStatus,
  });
  const releaseTypes = new Set(releases.map((r) => r.releaseType));

  const riskFlags = buildRiskFlags({
    overFunding: merged.overFunding.gt(0),
    fundingHealth: metrics.fundingHealth,
    remainingPositive: merged.remaining.gt(0),
    kpiNotPassed: kpiRows.length > 0,
    releaseTypes,
  });

  return { poolKey, orderIds, events, riskFlags };
}
