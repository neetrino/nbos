import { Logger } from '@nestjs/common';
import { createPrismaClient } from '@nbos/database';
import { resolveWhatsAppGatewayAccountId } from './product-communication-account';
import {
  applyLegacyDefaultAccountMigration,
  planLegacyDefaultAccountMigration,
} from './legacy-whatsapp-default-account.ops';

const logger = new Logger('LegacyWhatsAppDefaultAccount');

/**
 * Dry-run by default. Does not enqueue WhatsApp sends.
 *   pnpm exec tsx src/modules/messenger/core/legacy-whatsapp-default-account.cli.ts
 *   pnpm exec tsx src/modules/messenger/core/legacy-whatsapp-default-account.cli.ts --apply
 */
async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const prisma = createPrismaClient({ skipBudgetAssert: true });
  try {
    const target = await resolveWhatsAppGatewayAccountId(prisma);
    const plans = await planLegacyDefaultAccountMigration(prisma, target);
    const manual = plans.filter((plan) => plan.action === 'manual_review');
    logger.log(
      `legacy_whatsapp_default_audit mappings=${plans.length} manualReview=${manual.length} apply=${apply}`,
    );
    for (const plan of plans) {
      process.stdout.write(
        `${JSON.stringify({ action: plan.action, mappingId: plan.mappingId, reason: plan.reason })}\n`,
      );
    }
    if (!apply) return;
    const result = await applyLegacyDefaultAccountMigration(prisma, plans, target);
    logger.log(
      `legacy_whatsapp_default_apply migrated=${result.migrated} manualReview=${result.manualReview}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

const invoked = process.argv[1]?.includes('legacy-whatsapp-default-account.cli');
if (invoked) {
  void main().catch((caught: unknown) => {
    logger.error('legacy_whatsapp_default_audit_failed', caught);
    process.exitCode = 1;
  });
}
