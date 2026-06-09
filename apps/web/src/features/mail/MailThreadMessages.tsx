'use client';

import { Mail, Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared';
import { formatFileSize } from '@/features/drive/drive-format';
import type { MailMessageRow } from '@/lib/api/mail';
import { MailMessageBody } from './MailMessageBody';
import { MailOutboundDeliveryLogSection } from './MailOutboundDeliveryLogSection';

export interface MailThreadMessagesProps {
  threadId: string;
  messages: MailMessageRow[];
  canEdit: boolean;
  queueingMessageId: string | null;
  finalizingMessageId: string | null;
  cancellingMessageId: string | null;
  retryingFailedMessageId: string | null;
  onQueueDraft: (messageId: string) => void | Promise<void>;
  onFinalizeQueuedStub: (messageId: string) => void | Promise<void>;
  onCancelOutbound: (messageId: string) => void | Promise<void>;
  onResetFailedToDraft: (messageId: string) => void | Promise<void>;
}

export function MailThreadMessages({
  threadId,
  messages,
  canEdit,
  queueingMessageId,
  finalizingMessageId,
  cancellingMessageId,
  retryingFailedMessageId,
  onQueueDraft,
  onFinalizeQueuedStub,
  onCancelOutbound,
  onResetFailedToDraft,
}: MailThreadMessagesProps) {
  if (messages.length === 0) {
    return <EmptyState icon={Mail} title="No messages in this thread." />;
  }
  const outboundBusy =
    queueingMessageId !== null ||
    finalizingMessageId !== null ||
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
            {m.attachments.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {m.attachments.map((attachment) => {
                  const formattedSize = attachment.sizeBytes
                    ? formatFileSize(attachment.sizeBytes)
                    : null;
                  const size = formattedSize && formattedSize !== '-' ? formattedSize : null;
                  return (
                    <Badge key={attachment.id} variant="secondary" className="gap-1">
                      <Paperclip size={12} aria-hidden />
                      {attachment.fileName}
                      {size ? ` · ${size}` : ''}
                    </Badge>
                  );
                })}
              </div>
            ) : null}
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
                  variant="secondary"
                  size="sm"
                  disabled={outboundBusy}
                  onClick={() => void onFinalizeQueuedStub(m.id)}
                >
                  {finalizingMessageId === m.id ? 'Finalizing…' : 'Finalize send (stub → failed)'}
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
            {canEdit && m.direction === 'OUTBOUND' && m.deliveryStatus === 'FAILED' ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={outboundBusy}
                onClick={() => void onResetFailedToDraft(m.id)}
              >
                {retryingFailedMessageId === m.id ? 'Resetting…' : 'Reset to draft (retry)'}
              </Button>
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
