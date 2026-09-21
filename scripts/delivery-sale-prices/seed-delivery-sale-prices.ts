import { createPrismaClient, type PrismaClient } from '@nbos/database';
import {
  formatSalePriceSeedPlan,
  planDeliverySalePricesSeed,
  type SalePriceSeedPlanEntry,
} from './plan-delivery-sale-prices-seed';

const FIRST_VERSION = 1;
const APPLY_FLAG = '--apply';
const AUTHOR_FLAG = '--author=';

/**
 * Publishes one sale rate per catalog function. Dry run by default; `--apply` writes.
 * AI cards get 20 000 AMD per unit, everything else 10 000. Existing sale versions are never
 * overwritten. This does not publish units — catalog AMD stays unknown until units are published.
 */
async function main(): Promise<void> {
  const apply = process.argv.includes(APPLY_FLAG);
  const authorId = readAuthorId();
  const prisma = createPrismaClient({ role: 'all', skipBudgetAssert: true });
  try {
    const functions = await prisma.deliveryFunction.findMany({
      select: { id: true, code: true, category: true },
      orderBy: { code: 'asc' },
    });
    const existing = await prisma.deliverySalePriceVersion.findMany({
      select: { targetKey: true },
    });
    const plan = planDeliverySalePricesSeed(functions, [
      ...new Set(existing.map((row) => row.targetKey)),
    ]);
    process.stdout.write(`${formatSalePriceSeedPlan(plan, apply)}\n`);
    if (!apply) {
      process.stdout.write(
        `Re-run with ${APPLY_FLAG} ${AUTHOR_FLAG}<employeeId> to write these rows.\n`,
      );
      return;
    }
    const author = await resolveAuthorId(prisma, authorId);
    for (const entry of plan.entries) {
      if (entry.action === 'KEEP') continue;
      await createPublishedSalePrice(prisma, entry, author);
    }
    process.stdout.write(
      `Published ${plan.createCount} function sale prices. Catalog AMD appears only after units are published.\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

function readAuthorId(): string | null {
  const arg = process.argv.find((value) => value.startsWith(AUTHOR_FLAG));
  return arg ? arg.slice(AUTHOR_FLAG.length).trim() || null : null;
}

async function resolveAuthorId(prisma: PrismaClient, requested: string | null): Promise<string> {
  if (requested) {
    const employee = await prisma.employee.findUnique({
      where: { id: requested },
      select: { id: true },
    });
    if (!employee) {
      throw new Error(`Employee ${requested} not found. Pass a valid ${AUTHOR_FLAG}<employeeId>.`);
    }
    return employee.id;
  }
  throw new Error(
    `Author is required: pass ${AUTHOR_FLAG}<employeeId> of the Owner who publishes these prices.`,
  );
}

async function createPublishedSalePrice(
  prisma: PrismaClient,
  entry: Extract<SalePriceSeedPlanEntry, { action: 'CREATE' }>,
  authorId: string,
): Promise<void> {
  const now = new Date();
  await prisma.deliverySalePriceVersion.create({
    data: {
      targetKey: entry.targetKey,
      functionId: entry.item.id,
      version: FIRST_VERSION,
      status: 'PUBLISHED',
      effectiveFrom: now,
      amountPerUnit: entry.amountPerUnit,
      publishedById: authorId,
      publishedAt: now,
    },
  });
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
