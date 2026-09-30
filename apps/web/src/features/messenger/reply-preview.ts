export type MessengerReplyPreview = {
  id: string;
  senderName: string;
  content: string;
};

export function replyPreviewForMessage(
  row: { replyToMessageId?: string | null },
  rows: Array<{ id: string; senderName: string; content: string }>,
): MessengerReplyPreview | undefined {
  const id = row.replyToMessageId;
  if (!id) return undefined;
  const parent = rows.find((item) => item.id === id);
  if (!parent) return { id, senderName: 'Message', content: '' };
  return { id: parent.id, senderName: parent.senderName, content: parent.content };
}
