'use client';

import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MailMessageRow } from '@/lib/api/mail';
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
    return <EmptyThreadPlaceholder />;
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
            <pre className="font-sans text-sm whitespace-pre-wrap">{m.bodyText ?? '—'}</pre>
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

function EmptyThreadPlaceholder() {
  return (
    <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
      <Mail className="h-8 w-8" />
      <p className="text-sm">No messages in this thread.</p>
    </div>
  );
}
