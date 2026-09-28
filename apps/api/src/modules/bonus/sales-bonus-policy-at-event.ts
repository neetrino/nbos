import { Decimal, type LeadSourceEnum, type PrismaClient } from '@nbos/database';

export type SalesBonusPolicyRates = {
  sellerPercent: Decimal;
  assistantPercent: Decimal;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

export type SalesBonusPolicyAtEvent =
  | { status: 'found'; policy: SalesBonusPolicyRates }
  | { status: 'missing' }
  | { status: 'ambiguous' };

type PolicyRow = {
  sellerPercent: Decimal | number | string;
  assistantPercent: Decimal | number | string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

type PolicyAtEventDb = {
  salesBonusPolicy: {
    findMany: (args: {
      where: {
        fromCategory: LeadSourceEnum;
        paymentModel: string;
        effectiveFrom: { lte: Date };
        OR: Array<{ effectiveTo: null } | { effectiveTo: { gt: Date } }>;
      };
    }) => Promise<PolicyRow[]>;
  };
};

function toRates(row: PolicyRow): SalesBonusPolicyRates {
  return {
    sellerPercent: new Decimal(row.sellerPercent),
    assistantPercent: new Decimal(row.assistantPercent),
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
  };
}

function coversReceipt(row: PolicyRow, at: Date): boolean {
  if (row.effectiveFrom.getTime() > at.getTime()) {
    return false;
  }
  return row.effectiveTo == null || row.effectiveTo.getTime() > at.getTime();
}

/**
 * Policy covering the receipt instant. Overlapping versions hold. Historical
 * rows remain eligible after later deactivation (Q-40/Q-41).
 */
export async function loadSalesBonusPolicyAtEvent(
  db: PolicyAtEventDb | InstanceType<typeof PrismaClient>,
  params: {
    fromCategory: LeadSourceEnum;
    paymentModel: string;
    at: Date;
  },
): Promise<SalesBonusPolicyAtEvent> {
  const rows = await db.salesBonusPolicy.findMany({
    where: {
      fromCategory: params.fromCategory,
      paymentModel: params.paymentModel,
      effectiveFrom: { lte: params.at },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: params.at } }],
    },
  });
  const covering = rows.filter((row) => coversReceipt(row, params.at));
  if (covering.length === 0) {
    return { status: 'missing' };
  }
  if (covering.length !== 1 || covering[0] == null) {
    return { status: 'ambiguous' };
  }
  return { status: 'found', policy: toRates(covering[0]) };
}
