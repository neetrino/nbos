export function relockComposerOnConversationChange(
  unlockedConversationId: string | null,
  nextConversationId: string | null,
): string | null {
  if (!nextConversationId) return null;
  if (unlockedConversationId === nextConversationId) return unlockedConversationId;
  return null;
}

export function isClientComposerUnlocked(
  unlockedConversationId: string | null,
  conversationId: string | null,
): boolean {
  return Boolean(conversationId && unlockedConversationId === conversationId);
}

export function canUnlockClientComposer(canSend: boolean): boolean {
  return canSend;
}

export function isClientSendReady(input: {
  unlocked: boolean;
  canSend: boolean;
  conversationId: string | null;
  unlockedConversationId: string | null;
}): boolean {
  if (!input.canSend || !input.unlocked || !input.conversationId) return false;
  return input.unlockedConversationId === input.conversationId;
}
