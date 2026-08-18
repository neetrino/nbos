'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { confirmRetryFailedSend } from './mail-retry-failed-send-confirm';

export interface MailFailedOutboundActionsProps {
  threadId: string;
  messageId: string;
  outboundBusy: boolean;
  retryingSendMessageId: string | null;
  retryingFailedMessageId: string | null;
  onRetryFailedSend: (messageId: string) => void | Promise<void>;
  onResetFailedToDraft: (messageId: string) => void | Promise<void>;
}

export function MailFailedOutboundActions({
  threadId,
  messageId,
  outboundBusy,
  retryingSendMessageId,
  retryingFailedMessageId,
  onRetryFailedSend,
  onResetFailedToDraft,
}: MailFailedOutboundActionsProps) {
  const [confirmingRetry, setConfirmingRetry] = useState(false);

  const handleRetryClick = async () => {
    setConfirmingRetry(true);
    try {
      const confirmed = await confirmRetryFailedSend(threadId, messageId);
      if (confirmed) {
        await onRetryFailedSend(messageId);
      }
    } finally {
      setConfirmingRetry(false);
    }
  };

  const retryLabel =
    retryingSendMessageId === messageId
      ? 'Retrying…'
      : confirmingRetry
        ? 'Checking…'
        : 'Retry send';

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={outboundBusy || confirmingRetry}
        onClick={() => void handleRetryClick()}
      >
        {retryLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={outboundBusy}
        onClick={() => void onResetFailedToDraft(messageId)}
      >
        {retryingFailedMessageId === messageId ? 'Resetting…' : 'Reset to draft'}
      </Button>
    </div>
  );
}
