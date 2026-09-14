'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MailMessageRow } from '@/lib/api/mail';
import { MailFailedOutboundActions } from './MailFailedOutboundActions';
import { MailMessageBody } from './MailMessageBody';
import { MailOutboundDeliveryLogSection } from './MailOutboundDeliveryLogSection';
import { MailThreadAttachments } from './MailThreadAttachments';
import {
  formatMailMessageTime,
  mailInitialsFromLabel,
  messageSenderLabel,
  messageTimestampIso,
} from './mail-format';
import { MAIL_AVATAR_CLASS, MAIL_MESSAGE_CARD_CLASS } from './mail-ui-classes';

export interface MailThreadMessageCardProps {
  threadId: string;
  message: MailMessageRow;
  canEdit: boolean;
  outboundBusy: boolean;
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

export function MailThreadMessageCard({
  threadId,
  message,
  canEdit,
  outboundBusy,
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
}: MailThreadMessageCardProps) {
  const sender = messageSenderLabel(message);
  const timestamp = messageTimestampIso(message);
  const recipients = message.recipients
    .filter((row) => row.kind !== 'FROM')
    .map((row) => `${row.kind}: ${row.displayName ?? row.email}`)
    .join(' · ');

  return (
    <article className={MAIL_MESSAGE_CARD_CLASS}>
      <header className="mb-3 flex items-start gap-3">
        <span className={MAIL_AVATAR_CLASS} aria-hidden>
          {mailInitialsFromLabel(sender)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold">{sender}</p>
            <Badge variant="secondary" className="capitalize">
              {message.direction === 'INBOUND' ? 'Inbound' : 'Outbound'}
            </Badge>
            {message.deliveryStatus ? (
              <Badge variant="outline" className="capitalize">
                {message.deliveryStatus.toLowerCase()}
              </Badge>
            ) : null}
          </div>
          {recipients ? (
            <p className="text-muted-foreground truncate text-xs">{recipients}</p>
          ) : null}
        </div>
        {timestamp ? (
          <time className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {formatMailMessageTime(timestamp)}
          </time>
        ) : null}
      </header>

      <MailMessageBody bodyHtmlSanitized={message.bodyHtmlSanitized} bodyText={message.bodyText} />
      <MailThreadAttachments
        attachments={message.attachments}
        canEdit={canEdit}
        retryingAttachmentId={retryingAttachmentId}
        onRetryDownload={(attachmentId) => void onRetryAttachmentDownload(message.id, attachmentId)}
      />
      <MailThreadMessageActions
        threadId={threadId}
        message={message}
        canEdit={canEdit}
        outboundBusy={outboundBusy}
        queueingMessageId={queueingMessageId}
        retryingSendMessageId={retryingSendMessageId}
        cancellingMessageId={cancellingMessageId}
        retryingFailedMessageId={retryingFailedMessageId}
        onQueueDraft={onQueueDraft}
        onRetryFailedSend={onRetryFailedSend}
        onCancelOutbound={onCancelOutbound}
        onResetFailedToDraft={onResetFailedToDraft}
      />
    </article>
  );
}

function MailThreadMessageActions({
  threadId,
  message,
  canEdit,
  outboundBusy,
  queueingMessageId,
  retryingSendMessageId,
  cancellingMessageId,
  retryingFailedMessageId,
  onQueueDraft,
  onRetryFailedSend,
  onCancelOutbound,
  onResetFailedToDraft,
}: Omit<MailThreadMessageCardProps, 'retryingAttachmentId' | 'onRetryAttachmentDownload'>) {
  if (!canEdit || message.direction !== 'OUTBOUND') {
    return null;
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {message.deliveryStatus === 'DRAFT' ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={outboundBusy}
            onClick={() => void onQueueDraft(message.id)}
          >
            {queueingMessageId === message.id ? 'Queuing…' : 'Queue for send'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={outboundBusy}
            onClick={() => void onCancelOutbound(message.id)}
          >
            {cancellingMessageId === message.id ? 'Cancelling…' : 'Cancel'}
          </Button>
        </div>
      ) : null}
      {message.deliveryStatus === 'QUEUED' ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={outboundBusy}
          onClick={() => void onCancelOutbound(message.id)}
        >
          {cancellingMessageId === message.id ? 'Cancelling…' : 'Cancel'}
        </Button>
      ) : null}
      {message.deliveryStatus === 'FAILED' ? (
        <MailFailedOutboundActions
          threadId={threadId}
          messageId={message.id}
          outboundBusy={outboundBusy}
          retryingSendMessageId={retryingSendMessageId}
          retryingFailedMessageId={retryingFailedMessageId}
          onRetryFailedSend={onRetryFailedSend}
          onResetFailedToDraft={onResetFailedToDraft}
        />
      ) : null}
      <MailOutboundDeliveryLogSection
        key={`${message.id}-${message.deliveryStatus ?? 'none'}`}
        threadId={threadId}
        messageId={message.id}
      />
    </div>
  );
}
