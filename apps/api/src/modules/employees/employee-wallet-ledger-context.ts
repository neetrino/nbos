import type {
  BonusReleaseStatusEnum,
  BonusReleaseTypeEnum,
  Decimal,
  PrismaClient,
} from '@nbos/database';

import { loadAttributedBonusCashByRelease } from './employee-wallet-attributed-bonus-cash';
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

type WalletLedgerDb = InstanceType<typeof PrismaClient>;

export async function loadWalletBonusLedgerContext(
  prisma: WalletLedgerDb,
  bonusRows: WalletBonusLedgerEntry[],
  employeeId: string,
): Promise<{
  releaseRows: WalletBonusReleaseForLedger[];
  rollups: ReturnType<typeof buildWalletReleaseRollups>;
  poolByOrder: Map<string, WalletPoolForBreakdown>;
}> {
  const releaseRows = await loadWalletReleaseRows(prisma, bonusRows);
  const attributed = await loadAttributedBonusCashByRelease(prisma, employeeId, releaseRows);
  const plannedByEntryId = new Map(
    bonusRows.map((b) => [b.id, plannedDecimalForEntry(b.amount)] as const),
  );
  const rollups = buildWalletReleaseRollups(plannedByEntryId, releaseRows, attributed);
  const poolByOrder = await loadWalletPoolsByOrder(prisma, bonusRows);
  return { releaseRows, rollups, poolByOrder };
}

async function loadWalletReleaseRows(prisma: WalletLedgerDb, bonusRows: WalletBonusLedgerEntry[]) {
  const entryIds = bonusRows.map((b) => b.id);
  if (entryIds.length === 0) {
    return [];
  }
  return prisma.bonusRelease.findMany({
    where: { bonusEntryId: { in: entryIds } },
    select: {
      id: true,
      payrollRunId: true,
      bonusEntryId: true,
      amount: true,
      kpiBurnedAmount: true,
      kpiBurnedReason: true,
      payrollCarryOverAmount: true,
      status: true,
      releaseType: true,
      updatedAt: true,
      payrollRun: { select: { payrollMonth: true } },
    },
  });
}

async function loadWalletPoolsByOrder(
  prisma: WalletLedgerDb,
  bonusRows: WalletBonusLedgerEntry[],
): Promise<Map<string, WalletPoolForBreakdown>> {
  const orderIds = [...new Set(bonusRows.map((b) => b.orderId))];
  if (orderIds.length === 0) {
    return new Map();
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
  return new Map(poolRows.map((p) => [p.orderId, toWalletPool(p)] as const));
}

function toWalletPool(p: {
  orderId: string;
  availableFunding: Decimal;
  overFundingAmount: Decimal;
  totalPlannedAmount: Decimal;
  totalReleasedAmount: Decimal;
  status: WalletPoolForBreakdown['status'];
  product: { name: string } | null;
  extension: { name: string } | null;
}): WalletPoolForBreakdown {
  return {
    orderId: p.orderId,
    availableFunding: p.availableFunding,
    overFundingAmount: p.overFundingAmount,
    totalPlannedAmount: p.totalPlannedAmount,
    totalReleasedAmount: p.totalReleasedAmount,
    status: p.status,
    productName: p.product?.name ?? null,
    extensionName: p.extension?.name ?? null,
  };
}
