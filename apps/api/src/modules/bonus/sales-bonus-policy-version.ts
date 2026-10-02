import { BadRequestException } from '@nestjs/common';
import {
  Decimal,
  PrismaClient,
  type LeadSourceEnum,
  type SalesBonusPaymentModelEnum,
  type TransactionClient,
} from '@nbos/database';

export type SalesBonusPolicyVersionRow = {
  id: string;
  fromCategory: LeadSourceEnum;
  paymentModel: SalesBonusPaymentModelEnum;
  sellerPercent: Decimal;
  assistantPercent: Decimal;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  isActive: boolean;
};

export type SalesBonusPercentPatch = {
  sellerPercent?: number;
  assistantPercent?: number;
};

type PolicyVersionTx = Pick<TransactionClient, 'salesBonusPolicy' | '$queryRaw'>;

function percentsDiffer(
  current: { sellerPercent: Decimal; assistantPercent: Decimal },
  nextSeller: number,
  nextAssistant: number,
): boolean {
  return (
    !new Decimal(current.sellerPercent).eq(nextSeller) ||
    !new Decimal(current.assistantPercent).eq(nextAssistant)
  );
}

async function closeOpenVersionsForKey(
  prisma: Pick<InstanceType<typeof PrismaClient>, 'salesBonusPolicy'>,
  key: { fromCategory: LeadSourceEnum; paymentModel: SalesBonusPaymentModelEnum },
  closedAt: Date,
): Promise<void> {
  await prisma.salesBonusPolicy.updateMany({
    where: {
      fromCategory: key.fromCategory,
      paymentModel: key.paymentModel,
      effectiveTo: null,
    },
    data: { effectiveTo: closedAt, isActive: false },
  });
}

function createVersionData(
  row: Pick<SalesBonusPolicyVersionRow, 'fromCategory' | 'paymentModel'>,
  percents: { sellerPercent: number | Decimal; assistantPercent: number | Decimal },
  publishedAt: Date,
) {
  return {
    fromCategory: row.fromCategory,
    paymentModel: row.paymentModel,
    sellerPercent: percents.sellerPercent,
    assistantPercent: percents.assistantPercent,
    effectiveFrom: publishedAt,
    effectiveTo: null,
    isActive: true,
  };
}

/** Close only this row when it is still open. Do not touch another open version. */
export async function deactivateSalesBonusPolicyVersion(
  prisma: InstanceType<typeof PrismaClient>,
  row: SalesBonusPolicyVersionRow,
  closedAt: Date,
): Promise<SalesBonusPolicyVersionRow> {
  if (row.effectiveTo != null) {
    return row;
  }
  return prisma.salesBonusPolicy.update({
    where: { id: row.id },
    data: { effectiveTo: closedAt, isActive: false },
  });
}

/**
 * Serialize open-version checks for one category/payment-model key, then insert.
 * The partial unique index remains the durable guard when no open row exists yet.
 */
export async function reactivateSalesBonusPolicyVersion(
  prisma: InstanceType<typeof PrismaClient>,
  row: SalesBonusPolicyVersionRow,
  publishedAt: Date,
): Promise<SalesBonusPolicyVersionRow> {
  return prisma.$transaction(async (tx) => {
    await lockOpenSalesBonusPolicyKey(tx, row);
    const open = await tx.salesBonusPolicy.findFirst({
      where: {
        fromCategory: row.fromCategory,
        paymentModel: row.paymentModel,
        effectiveTo: null,
      },
      select: { id: true },
    });
    if (open) {
      throw new BadRequestException(
        'Cannot reactivate while another sales bonus policy version is already open for this category and payment model',
      );
    }
    return tx.salesBonusPolicy.create({
      data: createVersionData(row, row, publishedAt),
    });
  });
}

/**
 * Insert a new version at the change instant. Omitted percents come from the open
 * version for the key, never from a closed historical id.
 */
export async function publishSalesBonusPolicyVersion(
  prisma: InstanceType<typeof PrismaClient>,
  row: SalesBonusPolicyVersionRow,
  patch: SalesBonusPercentPatch,
  publishedAt: Date,
): Promise<SalesBonusPolicyVersionRow | null> {
  if (patch.sellerPercent === undefined && patch.assistantPercent === undefined) {
    return null;
  }
  const resolved = await resolvePublishPercents(prisma, row, patch);
  if (!percentsDiffer(resolved.baseline, resolved.sellerPercent, resolved.assistantPercent)) {
    return null;
  }
  return prisma.$transaction(async (tx) => {
    await lockOpenSalesBonusPolicyKey(tx, row);
    await closeOpenVersionsForKey(tx, row, publishedAt);
    return tx.salesBonusPolicy.create({
      data: createVersionData(row, resolved, publishedAt),
    });
  });
}

async function resolvePublishPercents(
  prisma: InstanceType<typeof PrismaClient>,
  row: SalesBonusPolicyVersionRow,
  patch: SalesBonusPercentPatch,
): Promise<{
  baseline: { sellerPercent: Decimal; assistantPercent: Decimal };
  sellerPercent: number;
  assistantPercent: number;
}> {
  const baseline = await loadPercentBaseline(prisma, row, patch);
  return {
    baseline,
    sellerPercent: patch.sellerPercent ?? Number(baseline.sellerPercent),
    assistantPercent: patch.assistantPercent ?? Number(baseline.assistantPercent),
  };
}

async function loadPercentBaseline(
  prisma: InstanceType<typeof PrismaClient>,
  row: SalesBonusPolicyVersionRow,
  patch: SalesBonusPercentPatch,
): Promise<{ sellerPercent: Decimal; assistantPercent: Decimal }> {
  if (row.effectiveTo == null) {
    return { sellerPercent: row.sellerPercent, assistantPercent: row.assistantPercent };
  }
  const open = await prisma.salesBonusPolicy.findFirst({
    where: {
      fromCategory: row.fromCategory,
      paymentModel: row.paymentModel,
      effectiveTo: null,
    },
    select: { sellerPercent: true, assistantPercent: true },
  });
  if (open) {
    return open;
  }
  if (patch.sellerPercent === undefined || patch.assistantPercent === undefined) {
    throw new BadRequestException(
      'Cannot change a closed sales bonus policy percent without an open version to supply the omitted rate',
    );
  }
  // Both rates were supplied explicitly; closed percents are only a no-op baseline.
  return { sellerPercent: row.sellerPercent, assistantPercent: row.assistantPercent };
}

async function lockOpenSalesBonusPolicyKey(
  tx: PolicyVersionTx,
  key: Pick<SalesBonusPolicyVersionRow, 'fromCategory' | 'paymentModel'>,
): Promise<void> {
  await tx.$queryRaw`
    SELECT id
    FROM sales_bonus_policies
    WHERE from_category = ${key.fromCategory}::"LeadSourceEnum"
      AND payment_model = ${key.paymentModel}::"SalesBonusPaymentModelEnum"
      AND effective_to IS NULL
    FOR UPDATE
  `;
}
