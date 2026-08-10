import type { MessengerUnifiedMessageRow } from '@/lib/api/messenger';
import { initialsFromDisplayName, type MessengerViewMessage } from './messenger-message-mapper';

export function mapUnifiedMessageToView(row: MessengerUnifiedMessageRow): MessengerViewMessage {
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
