'use client';

import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared';
import type { MailMessageRow } from '@/lib/api/mail';
import { MailFailedOutboundActions } from './MailFailedOutboundActions';
import { MailMessageBody } from './MailMessageBody';
import { MailOutboundDeliveryLogSection } from './MailOutboundDeliveryLogSection';
import { MailThreadAttachments } from './MailThreadAttachments';

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
    return <EmptyState icon={Mail} title="No messages in this thread." />;
  }
  const outboundBusy =
    queueingMessageId !== null ||
    retryingSendMessageId !== null ||
    cancellingMessageId !== null ||
    retryingFailedMessageId !== null;
  return (
    <div className="flex flex-col gap-4">
      {messages.map((m) => (
        <Card key={m.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {m.direction === 'INBOUND' ? 'Inbound' : 'Outbound'} · {m.readState}
              {m.deliveryStatus ? ` · ${m.deliveryStatus}` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground text-xs">
              {m.recipients.map((r) => `${r.kind}: ${r.displayName ?? r.email}`).join(' · ')}
            </p>
            <MailMessageBody bodyHtmlSanitized={m.bodyHtmlSanitized} bodyText={m.bodyText} />
            <MailThreadAttachments
              attachments={m.attachments}
              canEdit={canEdit}
              retryingAttachmentId={retryingAttachmentId}
              onRetryDownload={(attachmentId) => void onRetryAttachmentDownload(m.id, attachmentId)}
            />
            {canEdit && m.direction === 'OUTBOUND' && m.deliveryStatus === 'DRAFT' ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={outboundBusy}
                  onClick={() => void onQueueDraft(m.id)}
                >
                  {queueingMessageId === m.id ? 'Queuing…' : 'Queue for send'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={outboundBusy}
                  onClick={() => void onCancelOutbound(m.id)}
                >
                  {cancellingMessageId === m.id ? 'Cancelling…' : 'Cancel'}
                </Button>
              </div>
            ) : null}
            {canEdit && m.direction === 'OUTBOUND' && m.deliveryStatus === 'QUEUED' ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={outboundBusy}
                  onClick={() => void onCancelOutbound(m.id)}
                >
                  {cancellingMessageId === m.id ? 'Cancelling…' : 'Cancel'}
                </Button>
              </div>
            ) : null}
            {canEdit && m.direction === 'OUTBOUND' && m.deliveryStatus === 'FAILED' ? (
              <MailFailedOutboundActions
                threadId={threadId}
                messageId={m.id}
                outboundBusy={outboundBusy}
                retryingSendMessageId={retryingSendMessageId}
                retryingFailedMessageId={retryingFailedMessageId}
                onRetryFailedSend={onRetryFailedSend}
                onResetFailedToDraft={onResetFailedToDraft}
              />
            ) : null}
            {m.direction === 'OUTBOUND' ? (
              <MailOutboundDeliveryLogSection
                key={`${m.id}-${m.deliveryStatus ?? 'none'}`}
                threadId={threadId}
                messageId={m.id}
              />
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
