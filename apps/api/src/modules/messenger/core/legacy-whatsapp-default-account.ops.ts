import { Logger } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type {
  WhatsAppDestinationVerdict,
  WhatsAppGroupAccessProbe,
} from '../../integrations/whatsapp-gateway/whatsapp-destination-access';
import { WHATSAPP_FALLBACK_ACCOUNT_ID } from './product-communication.constants';

const logger = new Logger('LegacyWhatsAppDefaultAccount');

type PrismaLike = InstanceType<typeof PrismaClient>;

const DELIVERED = new Set(['SENT', 'DELIVERED', 'READ']);

export type LegacyAccountAction = 'migrate' | 'manual_review' | 'skip';

export type LegacyDefaultMapping = {
  id: string;
  conversationId: string;
  externalConversationId: string;
};

export type LegacyAccountPlanItem = {
  mappingId: string;
  conversationId: string;
  externalConversationId: string;
  action: LegacyAccountAction;
  reason: string;
};

export function assertRealWhatsAppAccountId(accountId: string): string {
  const trimmed = accountId.trim();
  if (!trimmed || trimmed === WHATSAPP_FALLBACK_ACCOUNT_ID) {
    throw new Error('Configured WhatsApp gateway account id is missing');
  }
  return trimmed;
}

/**
 * `migrate` requires no database conflict and a Gateway-confirmed group.
 * Timeout, 5xx, and an unknown destination stay `manual_review`.
 */
export function planLegacyDefaultMapping(input: {
  row: LegacyDefaultMapping;
  conflictConversationId: string | null;
  destination: WhatsAppDestinationVerdict | null;
}): LegacyAccountPlanItem {
  const base = {
    mappingId: input.row.id,
    conversationId: input.row.conversationId,
    externalConversationId: input.row.externalConversationId,
  };
  if (input.conflictConversationId && input.conflictConversationId !== input.row.conversationId) {
    return { ...base, action: 'manual_review', reason: 'target_chat_owned_by_other_conversation' };
  }
  if (input.conflictConversationId === input.row.conversationId) {
    return { ...base, action: 'skip', reason: 'already_on_target' };
  }
  if (!input.row.externalConversationId.endsWith('@g.us')) {
    return { ...base, action: 'manual_review', reason: 'destination_not_group' };
  }
  if (input.destination === 'account_mismatch') {
    return { ...base, action: 'manual_review', reason: 'account_mismatch' };
  }
  if (input.destination === 'account_unknown') {
    return { ...base, action: 'manual_review', reason: 'account_identity_unavailable' };
  }
  if (input.destination === 'accessible') {
    return { ...base, action: 'migrate', reason: 'gateway_verified' };
  }
  if (input.destination === 'missing') {
    return { ...base, action: 'manual_review', reason: 'group_not_accessible' };
  }
  return { ...base, action: 'manual_review', reason: 'gateway_unavailable' };
}

export async function planLegacyDefaultAccountMigration(
  prisma: PrismaLike,
  targetAccountId: string,
  probe: WhatsAppGroupAccessProbe,
): Promise<LegacyAccountPlanItem[]> {
  const target = assertRealWhatsAppAccountId(targetAccountId);
  const rows = await prisma.messengerExternalConversationMapping.findMany({
    where: { provider: 'WHATSAPP', externalAccountId: WHATSAPP_FALLBACK_ACCOUNT_ID },
    select: { id: true, conversationId: true, externalConversationId: true },
  });
  const plans: LegacyAccountPlanItem[] = [];
  for (const row of rows) {
    const plan = await planOneMapping(prisma, row, target, probe);
    logMappingPlan(plan);
    plans.push(plan);
  }
  return plans;
}

export async function applyLegacyDefaultAccountMigration(
  prisma: PrismaLike,
  plans: LegacyAccountPlanItem[],
  targetAccountId: string,
): Promise<{ migrated: number; manualReview: number }> {
  const target = assertRealWhatsAppAccountId(targetAccountId);
  let migrated = 0;
  let manualReview = 0;
  for (const plan of plans) {
    if (plan.action === 'manual_review') manualReview += 1;
    if (plan.action !== 'migrate') continue;
    const updated = await migrateOne(prisma, plan, target);
    if (updated) {
      migrated += 1;
      logger.log(`whatsapp_legacy_mapping_migrated mappingId=${plan.mappingId}`);
    } else manualReview += 1;
  }
  return { migrated, manualReview };
}

async function planOneMapping(
  prisma: PrismaLike,
  row: LegacyDefaultMapping,
  targetAccountId: string,
  probe: WhatsAppGroupAccessProbe,
): Promise<LegacyAccountPlanItem> {
  const conflict = await prisma.messengerExternalConversationMapping.findUnique({
    where: {
      provider_externalAccountId_externalConversationId: {
        provider: 'WHATSAPP',
        externalAccountId: targetAccountId,
        externalConversationId: row.externalConversationId,
      },
    },
    select: { conversationId: true },
  });
  const conflictConversationId = conflict?.conversationId ?? null;
  if (conflictConversationId) {
    return planLegacyDefaultMapping({ row, conflictConversationId, destination: null });
  }
  const destination = await readDestination(probe, row.externalConversationId, targetAccountId);
  return planLegacyDefaultMapping({ row, conflictConversationId: null, destination });
}

async function readDestination(
  probe: WhatsAppGroupAccessProbe,
  chatId: string,
  targetAccountId: string,
): Promise<WhatsAppDestinationVerdict> {
  try {
    return await probe(chatId, targetAccountId);
  } catch {
    return 'unavailable';
  }
}

function logMappingPlan(plan: LegacyAccountPlanItem): void {
  if (plan.action === 'migrate') {
    logger.log(`whatsapp_legacy_mapping_verified mappingId=${plan.mappingId}`);
    return;
  }
  if (plan.action === 'manual_review') {
    logger.warn(
      `whatsapp_legacy_mapping_manual_review mappingId=${plan.mappingId} reason=${plan.reason}`,
    );
  }
}

async function migrateOne(
  prisma: PrismaLike,
  plan: LegacyAccountPlanItem,
  targetAccountId: string,
): Promise<boolean> {
  try {
    const updated = await prisma.messengerExternalConversationMapping.updateMany({
      where: {
        id: plan.mappingId,
        provider: 'WHATSAPP',
        externalAccountId: WHATSAPP_FALLBACK_ACCOUNT_ID,
      },
      data: { externalAccountId: targetAccountId },
    });
    return updated.count === 1;
  } catch (caught) {
    if (isUniqueConflict(caught)) return false;
    throw caught;
  }
}

export function isDeliveredWhatsAppStatus(status: string): boolean {
  return DELIVERED.has(status);
}

function isUniqueConflict(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}
