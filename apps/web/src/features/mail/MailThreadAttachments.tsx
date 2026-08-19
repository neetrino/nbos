'use client';

import { useEffect, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/features/drive/drive-format';
import type { MailAttachmentRow } from '@/lib/api/mail';
import {
  canRetryAttachmentDownload,
  nextAttachmentRetryRevealAt,
} from './mail-attachment-retry-visibility';

export interface MailThreadAttachmentsProps {
  attachments: MailAttachmentRow[];
  canEdit: boolean;
  retryingAttachmentId: string | null;
  onRetryDownload: (attachmentId: string) => void | Promise<void>;
}

function attachmentSizeLabel(sizeBytes: string | null): string | null {
  if (!sizeBytes) {
    return null;
  }
  const formatted = formatFileSize(sizeBytes);
  return formatted && formatted !== '-' ? formatted : null;
}

function statusLabel(downloadStatus: string): string | null {
  if (downloadStatus === 'PENDING') {
    return 'Pending';
  }
  if (downloadStatus === 'FAILED') {
    return 'Failed';
  }
  return null;
}

function useAttachmentRetryClock(attachments: MailAttachmentRow[]): number {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const nextAt = nextAttachmentRetryRevealAt(attachments, nowMs);
    if (nextAt == null) {
      return;
    }
    const timer = window.setTimeout(() => setNowMs(Date.now()), Math.max(0, nextAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [attachments, nowMs]);
  return nowMs;
}

export function MailThreadAttachments({
  attachments,
  canEdit,
  retryingAttachmentId,
  onRetryDownload,
}: MailThreadAttachmentsProps) {
  const nowMs = useAttachmentRetryClock(attachments);
  if (attachments.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {attachments.map((attachment) => (
        <AttachmentChip
          key={attachment.id}
          attachment={attachment}
          canEdit={canEdit}
          nowMs={nowMs}
          retryingAttachmentId={retryingAttachmentId}
          onRetryDownload={onRetryDownload}
        />
      ))}
    </div>
  );
}

function AttachmentChip({
  attachment,
  canEdit,
  nowMs,
  retryingAttachmentId,
  onRetryDownload,
}: {
  attachment: MailAttachmentRow;
  canEdit: boolean;
  nowMs: number;
  retryingAttachmentId: string | null;
  onRetryDownload: (attachmentId: string) => void | Promise<void>;
}) {
  const size = attachmentSizeLabel(attachment.sizeBytes);
  const status = statusLabel(attachment.downloadStatus);
  const failed = attachment.downloadStatus === 'FAILED';
  const showRetry = canRetryAttachmentDownload({
    downloadStatus: attachment.downloadStatus,
    createdAt: attachment.createdAt,
    canEdit,
    nowMs,
  });
  return (
    <span className="inline-flex items-center gap-1">
      <Badge variant={failed ? 'destructive' : 'secondary'} className="gap-1">
        <Paperclip size={12} aria-hidden />
        {attachment.fileName}
        {size ? ` · ${size}` : ''}
        {status ? ` · ${status}` : ''}
      </Badge>
      {showRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={retryingAttachmentId !== null}
          onClick={() => void onRetryDownload(attachment.id)}
        >
          {retryingAttachmentId === attachment.id ? 'Retrying…' : 'Retry'}
        </Button>
      ) : null}
    </span>
  );
}
