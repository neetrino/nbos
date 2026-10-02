type ConversationOpener = (conversationId: string) => void;

const openers = new Set<ConversationOpener>();

/** Register an in-page opener (Internal Messenger). Returns unsubscribe. */
export function registerMessengerConversationOpener(opener: ConversationOpener): () => void {
  openers.add(opener);
  return () => {
    openers.delete(opener);
  };
}

/** Prefer an active Messenger screen; otherwise run the overlay fallback. */
export function openMessengerConversation(
  conversationId: string,
  fallback: ConversationOpener,
): void {
  if (openers.size === 0) {
    fallback(conversationId);
    return;
  }
  for (const opener of openers) opener(conversationId);
}
