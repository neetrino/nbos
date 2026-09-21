import { createPrismaClient, type PrismaClient } from '@nbos/database';
import {
  formatCleanupPlan,
  planSupersededCleanup,
  SUPERSEDED_FUNCTION_CODES,
  type CleanupCandidate,
} from './plan-superseded-cleanup';

const APPLY_FLAG = '--apply';

/**
 * Removes catalog cards that a tiered card replaced. Dry run by default. Only untouched drafts are
 * removed, and the check runs against the database rather than trusting this list, so a card that
 * someone already sold stays where it is.
 */
async function main(): Promise<void> {
  const apply = process.argv.includes(APPLY_FLAG);
  const prisma = createPrismaClient({ role: 'all', skipBudgetAssert: true });
  try {
    const candidates = await loadCandidates(prisma);
    const verdicts = planSupersededCleanup(candidates);
    process.stdout.write(`${formatCleanupPlan(verdicts, apply)}\n`);
    if (!apply) {
      process.stdout.write(`Re-run with ${APPLY_FLAG} to remove them.\n`);
      return;
    }
    for (const verdict of verdicts) {
      if (verdict.action === 'KEEP') continue;
      await removeDraftFunction(prisma, verdict.candidate.id);
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function loadCandidates(prisma: PrismaClient): Promise<CleanupCandidate[]> {
  const rows = await prisma.deliveryFunction.findMany({
    where: { code: { in: [...SUPERSEDED_FUNCTION_CODES] } },
    select: {
      id: true,
      code: true,
      status: true,
      _count: { select: { configurationFeatures: true } },
      priceVersions: { where: { status: 'PUBLISHED' }, select: { id: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    status: row.status,
    featureCount: row._count.configurationFeatures,
    publishedPriceCount: row.priceVersions.length,
  }));
}

async function removeDraftFunction(prisma: PrismaClient, functionId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.deliveryFunctionPriceVersion.deleteMany({ where: { functionId } });
    await tx.deliveryFunctionContentVersion.deleteMany({ where: { functionId } });
    await tx.deliveryFunction.delete({ where: { id: functionId } });
  });
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
