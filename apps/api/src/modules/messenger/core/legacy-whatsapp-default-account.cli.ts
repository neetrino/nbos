import { Logger } from '@nestjs/common';
import { createPrismaClient } from '@nbos/database';
import { createWhatsAppGroupProbe } from '../../integrations/whatsapp-gateway/whatsapp-destination-access';
import { resolveWhatsAppGatewayAccountId } from './product-communication-account';
import {
  applyLegacyDefaultAccountMigration,
  planLegacyDefaultAccountMigration,
} from './legacy-whatsapp-default-account.ops';
import { repairLegacyDefaultWhatsAppSend } from './legacy-whatsapp-send-repair.ops';

const logger = new Logger('LegacyWhatsAppDefaultAccount');

/**
 * Dry-run by default. Does not enqueue WhatsApp sends and does not run on startup.
 *   pnpm exec tsx src/modules/messenger/core/legacy-whatsapp-default-account.cli.ts
 *   pnpm exec tsx src/modules/messenger/core/legacy-whatsapp-default-account.cli.ts --apply
 *   pnpm exec tsx src/modules/messenger/core/legacy-whatsapp-default-account.cli.ts --repair-message=<id>
 */
async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const repairMessageId = readOption('repair-message');
  if (repairMessageId && apply) {
    logger.error('whatsapp_legacy_send_repair_rejected reason=mixed_flags');
    process.exitCode = 1;
    return;
  }
  const prisma = createPrismaClient({ skipBudgetAssert: true });
  try {
    if (repairMessageId) {
      await repairOne(prisma, repairMessageId);
      return;
    }
    await auditMappings(prisma, apply);
  } finally {
    await prisma.$disconnect();
  }
}

async function auditMappings(
  prisma: Parameters<typeof planLegacyDefaultAccountMigration>[0],
  apply: boolean,
): Promise<void> {
  const target = await resolveWhatsAppGatewayAccountId(prisma);
  const probe = await createWhatsAppGroupProbe(prisma);
  const plans = await planLegacyDefaultAccountMigration(prisma, target, probe);
  const manual = plans.filter((plan) => plan.action === 'manual_review');
  logger.log(
    `legacy_whatsapp_default_audit mappings=${plans.length} manualReview=${manual.length} apply=${apply}`,
  );
  for (const plan of plans) {
    process.stdout.write(`${JSON.stringify(reportPlan(plan))}\n`);
  }
  if (!apply) return;
  const result = await applyLegacyDefaultAccountMigration(prisma, plans, target);
  logger.log(
    `legacy_whatsapp_default_apply migrated=${result.migrated} manualReview=${result.manualReview}`,
  );
}

async function repairOne(
  prisma: Parameters<typeof repairLegacyDefaultWhatsAppSend>[0],
  messageId: string,
): Promise<void> {
  const probe = await createWhatsAppGroupProbe(prisma);
  const result = await repairLegacyDefaultWhatsAppSend(prisma, messageId, probe);
  process.stdout.write(
    `${JSON.stringify({
      messageId: result.messageId,
      commandId: result.commandId,
      action: result.action,
      reason: result.reason,
    })}\n`,
  );
  if (result.action !== 'repair') process.exitCode = 1;
}

function reportPlan(plan: {
  mappingId: string;
  conversationId: string;
  externalConversationId: string;
  action: string;
  reason: string;
}): { mappingId: string; conversationId: string; chatId: string; action: string; reason: string } {
  return {
    mappingId: plan.mappingId,
    conversationId: plan.conversationId,
    chatId: plan.externalConversationId,
    action: plan.action,
    reason: plan.reason,
  };
}

function readOption(name: string): string | null {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length).trim() || null;
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0) return null;
  return process.argv[index + 1]?.trim() || null;
}

const invoked = process.argv[1]?.includes('legacy-whatsapp-default-account.cli');
if (invoked) {
  void main().catch((caught: unknown) => {
    const name = caught instanceof Error ? caught.name : 'error';
    logger.error(`legacy_whatsapp_default_audit_failed error=${name}`);
    process.exitCode = 1;
  });
}
