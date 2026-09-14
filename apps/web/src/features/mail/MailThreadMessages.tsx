'use client';

import { Inbox } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import type { MailMessageRow } from '@/lib/api/mail';
import { MailThreadMessageCard } from './MailThreadMessageCard';

export interface MailThreadMessagesProps {
  threadId: string;
  messages: MailMessageRow[];
  canEdit: boolean;
  queueingMessageId: string | null;
  retryingSendMessageId: string | null;
  cancellingMessageId: string | null;
  retryingFailedMessageId: string | null;
  retryingAttachmentId: string | null;
  onQueueDraft: (messageId: string) => void | Promise<void>;
  onRetryFailedSend: (messageId: string) => void | Promise<void>;
  onCancelOutbound: (messageId: string) => void | Promise<void>;
  onResetFailedToDraft: (messageId: string) => void | Promise<void>;
  onRetryAttachmentDownload: (messageId: string, attachmentId: string) => void | Promise<void>;
}

export function MailThreadMessages({
  threadId,
  messages,
  canEdit,
  queueingMessageId,
  retryingSendMessageId,
  cancellingMessageId,
  retryingFailedMessageId,
  retryingAttachmentId,
  onQueueDraft,
  onRetryFailedSend,
  onCancelOutbound,
  onResetFailedToDraft,
  onRetryAttachmentDownload,
}: MailThreadMessagesProps) {
  if (messages.length === 0) {
    return <EmptyState icon={Inbox} title="No messages in this thread." />;
  }

  const outboundBusy =
    queueingMessageId !== null ||
    retryingSendMessageId !== null ||
    cancellingMessageId !== null ||
    retryingFailedMessageId !== null;

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => (
        <MailThreadMessageCard
          key={message.id}
          threadId={threadId}
          message={message}
          canEdit={canEdit}
          outboundBusy={outboundBusy}
          queueingMessageId={queueingMessageId}
          retryingSendMessageId={retryingSendMessageId}
          cancellingMessageId={cancellingMessageId}
          retryingFailedMessageId={retryingFailedMessageId}
          retryingAttachmentId={retryingAttachmentId}
          onQueueDraft={onQueueDraft}
          onRetryFailedSend={onRetryFailedSend}
          onCancelOutbound={onCancelOutbound}
          onResetFailedToDraft={onResetFailedToDraft}
          onRetryAttachmentDownload={onRetryAttachmentDownload}
        />
      ))}
    </div>
  );
}
