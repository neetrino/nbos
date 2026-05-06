import { Decimal, PrismaClient, type PartnerAccrualStatusEnum } from '@nbos/database';

const PARTNER_ACCRUAL_STATUSES: PartnerAccrualStatusEnum[] = [
  'ACCRUED',
  'ELIGIBLE',
  'IN_BATCH',
  'PAID',
  'CANCELLED',
];

/** Wire: NBOS § Partner Payouts — balance roll-up by accrual status (no payout batch yet). */
export interface PartnerAccrualBalanceDto {
  byStatus: Record<PartnerAccrualStatusEnum, string>;
  /** Sum of ACCRUED + ELIGIBLE + IN_BATCH (not yet marked paid to partner). */
  unpaidTotal: string;
  /** Sum of PAID accruals. */
  paidTotal: string;
}

export async function loadPartnerAccrualBalance(
  prisma: InstanceType<typeof PrismaClient>,
  partnerId: string,
): Promise<PartnerAccrualBalanceDto> {
  const grouped = await prisma.partnerAccrual.groupBy({
    by: ['status'],
    where: { partnerId },
    _sum: { amount: true },
  });

  const sums = new Map<PartnerAccrualStatusEnum, Decimal>();
  for (const s of PARTNER_ACCRUAL_STATUSES) {
    sums.set(s, new Decimal(0));
  }
  for (const row of grouped) {
    sums.set(row.status, new Decimal(row._sum.amount?.toString() ?? '0'));
  }

  const byStatus = Object.fromEntries(
    PARTNER_ACCRUAL_STATUSES.map((s) => [s, sums.get(s)!.toFixed(2)]),
  ) as PartnerAccrualBalanceDto['byStatus'];

  const unpaidTotal = sums.get('ACCRUED')!.plus(sums.get('ELIGIBLE')!).plus(sums.get('IN_BATCH')!);

  return {
    byStatus,
    unpaidTotal: unpaidTotal.toFixed(2),
    paidTotal: sums.get('PAID')!.toFixed(2),
  };
}
