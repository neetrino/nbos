import { Decimal, type Prisma, type PrismaClient } from '@nbos/database';

export interface PartnerAnalyticsDto {
  referredLeadCount: number;
  partnerDealCount: number;
  wonDealCount: number;
  dealConversionRate: string | null;
  referredClientRevenue: string;
  accruedPartnerPayouts: string;
  paidPartnerPayouts: string;
  outboundPartnerRevenue: string;
}

function decToStr(value: Decimal | null | undefined): string {
  if (value == null) return '0.00';
  return value.toFixed(2);
}

/**
 * Read-only partner funnel + money rollups (NBOS § Partner Analytics). Uses Finance `moneyStatus`
 * and existing accrual rows; does not infer missing payments.
 */
export async function loadPartnerAnalytics(
  prisma: InstanceType<typeof PrismaClient>,
  partnerId: string,
): Promise<PartnerAnalyticsDto> {
  const [
    referredLeadCount,
    partnerDealCount,
    wonDealCount,
    referredRevenueAgg,
    accrualGroups,
    outboundAgg,
  ] = await Promise.all([
    prisma.lead.count({
      where: { source: 'PARTNER', sourcePartnerId: partnerId },
    }),
    prisma.deal.count({
      where: { source: 'PARTNER', sourcePartnerId: partnerId },
    }),
    prisma.deal.count({
      where: { source: 'PARTNER', sourcePartnerId: partnerId, status: 'WON' },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        invoice: {
          moneyStatus: 'PAID',
          order: {
            deal: { source: 'PARTNER', sourcePartnerId: partnerId },
          },
        },
      },
    }),
    prisma.partnerAccrual.groupBy({
      by: ['status'],
      where: { partnerId },
      _sum: { amount: true },
    }),
    loadOutboundPartnerRevenue(prisma, partnerId),
  ]);

  const dealConversionRate =
    partnerDealCount > 0 ? (wonDealCount / partnerDealCount).toFixed(4) : null;

  let accrued = new Decimal(0);
  let paid = new Decimal(0);
  for (const row of accrualGroups) {
    const sum = row._sum.amount ? new Decimal(row._sum.amount.toString()) : new Decimal(0);
    if (row.status === 'PAID') paid = paid.plus(sum);
    else if (row.status !== 'CANCELLED') accrued = accrued.plus(sum);
  }

  return {
    referredLeadCount,
    partnerDealCount,
    wonDealCount,
    dealConversionRate,
    referredClientRevenue: decToStr(referredRevenueAgg._sum.amount),
    accruedPartnerPayouts: accrued.toFixed(2),
    paidPartnerPayouts: paid.toFixed(2),
    outboundPartnerRevenue: outboundAgg.toFixed(2),
  };
}

async function loadOutboundPartnerRevenue(
  prisma: InstanceType<typeof PrismaClient>,
  partnerId: string,
): Promise<Decimal> {
  const terms = await prisma.partnerServiceTerm.findMany({
    where: { partnerId },
    select: { invoiceId: true, subscriptionId: true },
  });
  const invoiceIds = [
    ...new Set(terms.map((t) => t.invoiceId).filter((id): id is string => Boolean(id))),
  ];
  const subscriptionIds = [
    ...new Set(terms.map((t) => t.subscriptionId).filter((id): id is string => Boolean(id))),
  ];
  if (invoiceIds.length === 0 && subscriptionIds.length === 0) {
    return new Decimal(0);
  }

  const invoiceOr: Prisma.InvoiceWhereInput[] = [];
  if (invoiceIds.length > 0) invoiceOr.push({ id: { in: invoiceIds } });
  if (subscriptionIds.length > 0) invoiceOr.push({ subscriptionId: { in: subscriptionIds } });

  const agg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: {
      invoice: {
        moneyStatus: 'PAID',
        OR: invoiceOr,
      },
    },
  });

  return agg._sum.amount ? new Decimal(agg._sum.amount.toString()) : new Decimal(0);
}
