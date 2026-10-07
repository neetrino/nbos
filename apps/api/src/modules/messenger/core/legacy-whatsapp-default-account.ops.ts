import type { PrismaClient } from '@nbos/database';
import { WHATSAPP_FALLBACK_ACCOUNT_ID } from './product-communication.constants';

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

/** Unambiguous `default` mappings can move. Conflicting chats stay for a person. */
export function planLegacyDefaultMapping(input: {
  row: LegacyDefaultMapping;
  conflictConversationId: string | null;
}): LegacyAccountPlanItem {
  const base = {
    mappingId: input.row.id,
    conversationId: input.row.conversationId,
    externalConversationId: input.row.externalConversationId,
  };
  if (!input.conflictConversationId) {
    return { ...base, action: 'migrate', reason: 'no_target_mapping' };
  }
  if (input.conflictConversationId === input.row.conversationId) {
    return { ...base, action: 'skip', reason: 'already_on_target' };
  }
  return { ...base, action: 'manual_review', reason: 'target_chat_owned_by_other_conversation' };
}

export async function planLegacyDefaultAccountMigration(
  prisma: PrismaLike,
  targetAccountId: string,
): Promise<LegacyAccountPlanItem[]> {
  const target = assertRealWhatsAppAccountId(targetAccountId);
  const rows = await prisma.messengerExternalConversationMapping.findMany({
    where: { provider: 'WHATSAPP', externalAccountId: WHATSAPP_FALLBACK_ACCOUNT_ID },
    select: { id: true, conversationId: true, externalConversationId: true },
  });
  const plans: LegacyAccountPlanItem[] = [];
  for (const row of rows) {
    plans.push(await planOneMapping(prisma, row, target));
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
    if (updated) migrated += 1;
    else manualReview += 1;
  }
  return { migrated, manualReview };
}

async function planOneMapping(
  prisma: PrismaLike,
  row: LegacyDefaultMapping,
  targetAccountId: string,
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
  return planLegacyDefaultMapping({
    row,
    conflictConversationId: conflict?.conversationId ?? null,
  });
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
