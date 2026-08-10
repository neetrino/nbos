import type { PrismaClient } from '@nbos/database';

export type ResolveChannelConversationTargetResult =
  | { ok: true; conversationId: string; createWithLegacyId: boolean; reconciled: boolean }
  | { ok: false; reason: string };

/**
 * Prefer an existing canonical conversation over creating a second row with the legacy id.
 */
export async function resolveChannelConversationTarget(
  prisma: InstanceType<typeof PrismaClient>,
  plan: { conversationId: string; canonicalKey: string },
): Promise<ResolveChannelConversationTargetResult> {
  const byCanonical = await prisma.messengerConversation.findUnique({
    where: { canonicalKey: plan.canonicalKey },
    select: { id: true },
  });
  const byLegacyId = await prisma.messengerConversation.findUnique({
    where: { id: plan.conversationId },
    select: { id: true, canonicalKey: true },
  });

  if (byCanonical && byLegacyId && byCanonical.id !== byLegacyId.id) {
    return {
      ok: false,
      reason: `Conflict: canonical ${plan.canonicalKey} is ${byCanonical.id} but legacy-id row ${byLegacyId.id} also exists`,
    };
  }
  if (byCanonical) {
    return {
      ok: true,
      conversationId: byCanonical.id,
      createWithLegacyId: false,
      reconciled: byCanonical.id !== plan.conversationId,
    };
  }
  return {
    ok: true,
    conversationId: plan.conversationId,
    createWithLegacyId: true,
    reconciled: false,
  };
}

/** Test alias — same function. */
export const resolveChannelConversationTargetForTest = resolveChannelConversationTarget;
