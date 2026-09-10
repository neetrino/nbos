export type AbsoluteConversationUnreadInput = {
  viewerEmployeeId: string;
  latestSenderId: string | null;
  lastMessageAt: Date | null;
  lastReadAt: Date | null;
};

/**
 * Binary 0/1 unread. Own latest send is never unread.
 * `latestSenderId` null (inbound/external) stays unread when the cursor is behind.
 */
export function absoluteConversationUnreadCount(input: AbsoluteConversationUnreadInput): number {
  if (!input.lastMessageAt) return 0;
  if (input.latestSenderId && input.latestSenderId === input.viewerEmployeeId) return 0;
  if (input.lastReadAt === null || input.lastMessageAt > input.lastReadAt) return 1;
  return 0;
}
