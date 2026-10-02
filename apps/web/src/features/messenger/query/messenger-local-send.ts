import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import type { MessengerZone } from './messenger-query-keys';

const LOCAL_CORE_MESSAGE_PREFIX = 'local:';
const LOCAL_SENDING_LABEL = 'Sending';
const LOCAL_FAILED_LABEL = 'Not sent';
const LOCAL_UNCONFIRMED_LABEL = 'Unconfirmed';
const FALLBACK_SENDER_NAME = 'You';

export const TASK_PENDING_CONVERSATION_PREFIX = 'task-pending:';

export function taskPendingConversationId(taskId: string): string {
  return `${TASK_PENDING_CONVERSATION_PREFIX}${taskId}`;
}

export function localCoreMessageId(idempotencyKey: string): string {
  return `${LOCAL_CORE_MESSAGE_PREFIX}${idempotencyKey}`;
}

export function messengerComposerSenderName(
  person: { firstName?: string | null; lastName?: string | null } | null | undefined,
): string {
  const name = [person?.firstName, person?.lastName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' ');
  return name || FALLBACK_SENDER_NAME;
}

/** Optimistic row. Provider status stays unset until the server names it. */
export function buildOptimisticCoreMessage(input: {
  conversationId: string;
  content: string;
  idempotencyKey: string;
  senderId: string | null;
  senderName: string;
  zone: MessengerZone;
  createdAt: string;
  replyToMessageId?: string;
  mentionedEmployeeIds?: string[];
  phase?: NonNullable<MessengerCoreMessageRow['localSend']>['phase'];
}): MessengerCoreMessageRow {
  const phase = input.phase ?? 'sending';
  return {
    id: localCoreMessageId(input.idempotencyKey),
    conversationId: input.conversationId,
    senderId: input.senderId,
    senderName: input.senderName,
    content: input.content,
    createdAt: input.createdAt,
    editedAt: null,
    direction: input.zone === 'CLIENT' ? 'OUTBOUND' : 'INTERNAL',
    idempotencyKey: input.idempotencyKey,
    replyToMessageId: input.replyToMessageId,
    mentionedEmployeeIds: input.mentionedEmployeeIds,
    attachments: [],
    localSend: { idempotencyKey: input.idempotencyKey, phase },
  };
}

/** UI label for a local send. Null once the row is canonical. */
export function localSendReceiptLabel(row: MessengerCoreMessageRow): string | null {
  if (row.status === 'OUTCOME_UNKNOWN' && row.localSend) return LOCAL_UNCONFIRMED_LABEL;
  const phase = row.localSend?.phase;
  if (phase === 'failed') return LOCAL_FAILED_LABEL;
  if (phase === 'pending' || phase === 'sending' || phase === 'retrying')
    return LOCAL_SENDING_LABEL;
  return null;
}

export function failedLocalSendKey(row: MessengerCoreMessageRow): string | null {
  if (row.status === 'OUTCOME_UNKNOWN') return null;
  if (row.localSend?.phase !== 'failed') return null;
  return row.localSend.idempotencyKey;
}
