export type PendingForwardDraft = {
  conversationId: string;
  sourceMessageIds: string[];
  senderName: string;
  content: string;
};

export function composerQuoteFromForward(draft: PendingForwardDraft): {
  senderName: string;
  content: string;
} {
  return {
    senderName: `Forwarded from ${draft.senderName}`,
    content: draft.content,
  };
}
