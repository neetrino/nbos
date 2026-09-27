import { BadRequestException } from '@nestjs/common';
import { Decimal, PrismaClient, type LeadSourceEnum } from '@nbos/database';

export type SalesBonusPolicyVersionRow = {
  id: string;
  fromCategory: LeadSourceEnum;
  paymentModel: string;
  sellerPercent: Decimal;
  assistantPercent: Decimal;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  isActive: boolean;
};

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
  prisma: InstanceType<typeof PrismaClient>,
  key: { fromCategory: LeadSourceEnum; paymentModel: string },
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
  row: SalesBonusPolicyVersionRow,
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

/** New open version at now only when this key has no open version. */
export async function reactivateSalesBonusPolicyVersion(
  prisma: InstanceType<typeof PrismaClient>,
  row: SalesBonusPolicyVersionRow,
  publishedAt: Date,
): Promise<SalesBonusPolicyVersionRow> {
  return prisma.$transaction(async (tx) => {
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
 * Insert a new version at the change instant. Does not overwrite historical percents
 * and does not accept a client-supplied effectiveFrom.
 */
export async function publishSalesBonusPolicyVersion(
  prisma: InstanceType<typeof PrismaClient>,
  row: SalesBonusPolicyVersionRow,
  next: { sellerPercent: number; assistantPercent: number },
  publishedAt: Date,
): Promise<SalesBonusPolicyVersionRow | null> {
  if (!percentsDiffer(row, next.sellerPercent, next.assistantPercent)) {
    return null;
  }
  return prisma.$transaction(async (tx) => {
    await closeOpenVersionsForKey(tx as InstanceType<typeof PrismaClient>, row, publishedAt);
    return tx.salesBonusPolicy.create({
      data: createVersionData(row, next, publishedAt),
    });
  });
}
