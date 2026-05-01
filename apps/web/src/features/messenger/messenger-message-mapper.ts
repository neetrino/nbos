import type { MessengerMessageRow } from '@/lib/api/messenger';

export interface MessengerViewMessage {
  id: string;
  senderId: string;
  senderName: string;
  initials: string;
  content: string;
  timestamp: string;
  attachments: Array<{ id: string; fileAssetId: string }>;
}

export function initialsFromDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const one = parts[0];
    return one ? one.slice(0, 2).toUpperCase() : '?';
  }
  const firstWord = parts[0];
  const lastWord = parts[parts.length - 1];
  const first = firstWord?.[0] ?? '';
  const last = lastWord?.[0] ?? '';
  const pair = `${first}${last}`.trim();
  return pair.length > 0 ? pair.toUpperCase() : '?';
}

export function mapMessengerRowToView(row: MessengerMessageRow): MessengerViewMessage {
  return {
    id: row.id,
    senderId: row.senderId,
    senderName: row.senderName,
    initials: initialsFromDisplayName(row.senderName),
    content: row.content,
    timestamp: row.createdAt,
    attachments: row.attachments.map((attachment) => ({
      id: attachment.id,
      fileAssetId: attachment.fileAssetId,
    })),
  };
}
