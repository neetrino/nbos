/**
 * CLI: backfill / verify legacy Internal Messenger → unified schema.
 *
 *   pnpm messenger:backfill:dry
 *   pnpm messenger:backfill:apply
 *   pnpm messenger:backfill:verify
 *
 * Does not modify legacy tables. Does not cut over REST/Socket.IO.
 * Do not run --apply against production without an explicit ops decision.
 */
import dotenv from 'dotenv';
import path from 'path';
import { createPrismaClient } from '@nbos/database';
import { runMessengerLegacyBackfill } from '../src/modules/messenger/migration/messenger-legacy-backfill.ops';
import { verifyMessengerLegacyBackfillParity } from '../src/modules/messenger/migration/messenger-legacy-parity.ops';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

type Mode = 'dry-run' | 'apply' | 'verify';

function parseMode(argv: string[]): Mode {
  if (argv.includes('--apply')) return 'apply';
  if (argv.includes('--verify')) return 'verify';
  return 'dry-run';
}

async function assertUnifiedTablesExist(
  prisma: ReturnType<typeof createPrismaClient>,
): Promise<void> {
  try {
    await prisma.messengerConversation.count();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Unified messenger tables are missing. Apply additive migration 20260804120000_messenger_unified_conversation_foundation first. Underlying error: ${message}`,
    );
  }
}

async function main(): Promise<void> {
  const mode = parseMode(process.argv.slice(2));
  process.env.PROCESS_ROLE = process.env.PROCESS_ROLE ?? 'api';

  const prisma = createPrismaClient({ skipBudgetAssert: true });
  try {
    await assertUnifiedTablesExist(prisma);

    if (mode === 'verify') {
      const report = await verifyMessengerLegacyBackfillParity(prisma);
      console.log(JSON.stringify(report, null, 2));
      process.exitCode = report.ok ? 0 : 2;
      return;
    }

    const result = await runMessengerLegacyBackfill(prisma, {
      mode: mode === 'apply' ? 'apply' : 'dry-run',
    });
    console.log(JSON.stringify(result, null, 2));

    if (mode === 'apply') {
      const report = await verifyMessengerLegacyBackfillParity(prisma);
      console.log(JSON.stringify({ parity: report }, null, 2));
      process.exitCode = report.ok ? 0 : 2;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
