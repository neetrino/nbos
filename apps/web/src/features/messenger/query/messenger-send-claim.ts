type ComposerClaim = {
  content: string;
  key: string;
  observedDraft: string;
};

const claims = new Map<string, ComposerClaim>();

/**
 * One logical composer submit. A second call with the same text is ignored
 * until the draft changes, so a double-click reuses the first key.
 */
export function claimComposerSend(
  conversationId: string,
  content: string,
): { accepted: boolean; key: string } {
  const slot = claims.get(conversationId);
  if (slot && slot.content === content && slot.observedDraft !== content) {
    return { accepted: false, key: slot.key };
  }
  const key = crypto.randomUUID();
  claims.set(conversationId, { content, key, observedDraft: content });
  return { accepted: true, key };
}

/** Composer was cleared for the claim. A stale resubmit of that text is ignored. */
export function markComposerSendCleared(conversationId: string): void {
  const slot = claims.get(conversationId);
  if (!slot) return;
  slot.observedDraft = '';
}

/** User edited the draft. The same text typed again is a new logical message. */
export function noteMessengerComposerDraft(conversationId: string | null, draft: string): void {
  if (!conversationId) return;
  const slot = claims.get(conversationId);
  if (!slot) return;
  slot.observedDraft = draft;
}

export function resetMessengerComposerClaims(): void {
  claims.clear();
}
