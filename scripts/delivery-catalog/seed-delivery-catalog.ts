import { PrismaClient } from '@nbos/database';
import {
  SEED_ACCEPTANCE_PLACEHOLDER,
  SEED_INSTRUCTIONS_PLACEHOLDER,
  type DeliveryCatalogSeedItem,
} from './delivery-catalog-seed-data';
import { formatSeedPlan, planDeliveryCatalogSeed } from './plan-delivery-catalog-seed';

const FIRST_CONTENT_VERSION = 1;
const APPLY_FLAG = '--apply';
const AUTHOR_FLAG = '--author=';

/**
 * Creates the draft delivery catalog skeleton. Dry run by default; `--apply` writes.
 * Draft only: no units, no rates, no assignments, and existing codes are left untouched.
 */
async function main(): Promise<void> {
  const apply = process.argv.includes(APPLY_FLAG);
  const authorId = readAuthorId();
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.deliveryFunction.findMany({ select: { id: true, code: true } });
    const plan = planDeliveryCatalogSeed(existing);
    process.stdout.write(`${formatSeedPlan(plan, apply)}\n`);
    if (!apply) {
      process.stdout.write(`Re-run with ${APPLY_FLAG} to write these rows.\n`);
      return;
    }
    const author = await resolveAuthorId(prisma, authorId);
    for (const entry of plan.entries) {
      if (entry.action === 'KEEP') continue;
      await createDraftFunction(prisma, entry.item, author);
    }
    process.stdout.write(`Created ${plan.createCount} draft catalog functions.\n`);
  } finally {
    await prisma.$disconnect();
  }
}

function readAuthorId(): string | null {
  const arg = process.argv.find((value) => value.startsWith(AUTHOR_FLAG));
  return arg ? arg.slice(AUTHOR_FLAG.length).trim() || null : null;
}

async function resolveAuthorId(
  prisma: InstanceType<typeof PrismaClient>,
  requested: string | null,
): Promise<string> {
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
    `Author is required: pass ${AUTHOR_FLAG}<employeeId> of the Owner or CEO who owns these drafts.`,
  );
}

async function createDraftFunction(
  prisma: InstanceType<typeof PrismaClient>,
  item: DeliveryCatalogSeedItem,
  authorId: string,
): Promise<void> {
  await prisma.deliveryFunction.create({
    data: {
      code: item.code,
      category: item.category,
      iconKey: item.iconKey,
      status: 'DRAFT',
      authorId,
      contentVersions: {
        create: {
          version: FIRST_CONTENT_VERSION,
          title: item.title,
          summary: item.summary,
          scopeBoundaries: item.scopeBoundaries,
          instructions: SEED_INSTRUCTIONS_PLACEHOLDER,
          acceptanceCriteria: SEED_ACCEPTANCE_PLACEHOLDER,
          authorId,
        },
      },
    },
  });
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
