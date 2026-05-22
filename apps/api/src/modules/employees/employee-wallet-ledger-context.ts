import type {
  BonusReleaseStatusEnum,
  BonusReleaseTypeEnum,
  Decimal,
  PrismaClient,
} from '@nbos/database';

import {
  buildWalletReleaseRollups,
  plannedDecimalForEntry,
} from './employee-wallet-bonus-release-rollups';
import type { WalletPoolForBreakdown } from './employee-wallet-project-breakdown';

/** Minimal bonus entry fields needed for wallet rollups and project breakdown. */
export interface WalletBonusLedgerEntry {
  id: string;
  orderId: string;
  amount: Decimal;
}

export type WalletBonusReleaseForLedger = {
  bonusEntryId: string;
  amount: Decimal;
  status: BonusReleaseStatusEnum;
  releaseType: BonusReleaseTypeEnum;
  updatedAt: Date;
  payrollRun: { payrollMonth: string } | null;
};

export async function loadWalletBonusLedgerContext(
  prisma: InstanceType<typeof PrismaClient>,
  bonusRows: WalletBonusLedgerEntry[],
): Promise<{
  releaseRows: WalletBonusReleaseForLedger[];
  rollups: ReturnType<typeof buildWalletReleaseRollups>;
  poolByOrder: Map<string, WalletPoolForBreakdown>;
}> {
  const entryIds = bonusRows.map((b) => b.id);
  const releaseRows =
    entryIds.length === 0
      ? []
      : await prisma.bonusRelease.findMany({
          where: { bonusEntryId: { in: entryIds } },
          select: {
            bonusEntryId: true,
            amount: true,
            kpiBurnedAmount: true,
            payrollCarryOverAmount: true,
            status: true,
            releaseType: true,
            updatedAt: true,
            payrollRun: { select: { payrollMonth: true } },
          },
        });

  const plannedByEntryId = new Map(
    bonusRows.map((b) => [b.id, plannedDecimalForEntry(b.amount)] as const),
  );
  const rollups = buildWalletReleaseRollups(plannedByEntryId, releaseRows);

  const orderIds = [...new Set(bonusRows.map((b) => b.orderId))];
  if (orderIds.length === 0) {
    return { releaseRows, rollups, poolByOrder: new Map() };
  }

  const poolRows = await prisma.productBonusPool.findMany({
    where: { orderId: { in: orderIds } },
    select: {
      orderId: true,
      availableFunding: true,
      overFundingAmount: true,
      totalPlannedAmount: true,
      totalReleasedAmount: true,
      status: true,
      product: { select: { name: true } },
      extension: { select: { name: true } },
    },
  });

  const poolByOrder = new Map(
    poolRows.map(
      (p) =>
        [
          p.orderId,
          {
            orderId: p.orderId,
            availableFunding: p.availableFunding,
            overFundingAmount: p.overFundingAmount,
            totalPlannedAmount: p.totalPlannedAmount,
            totalReleasedAmount: p.totalReleasedAmount,
            status: p.status,
            productName: p.product?.name ?? null,
            extensionName: p.extension?.name ?? null,
          } satisfies WalletPoolForBreakdown,
        ] as const,
    ),
  );

  return { releaseRows, rollups, poolByOrder };
}
