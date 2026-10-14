'use client';

import { useEffect, useState } from 'react';
import { Download, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/features/drive/drive-format';
import { mailApi, type MailAttachmentRow } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { canSaveMailAttachment, openBrowserDownload } from './mail-attachment-download';
import {
  canRetryAttachmentDownload,
  nextAttachmentRetryRevealAt,
} from './mail-attachment-retry-visibility';

export interface MailThreadAttachmentsProps {
  threadId: string;
  messageId: string;
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
  threadId,
  messageId,
  attachments,
  canEdit,
  retryingAttachmentId,
  onRetryDownload,
}: MailThreadAttachmentsProps) {
  const nowMs = useAttachmentRetryClock(attachments);
  const [savingAttachmentId, setSavingAttachmentId] = useState<string | null>(null);
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
          saving={savingAttachmentId === attachment.id}
          onRetryDownload={onRetryDownload}
          onSave={() =>
            void saveAttachment({
              threadId,
              messageId,
              attachmentId: attachment.id,
              setSavingAttachmentId,
            })
          }
        />
      ))}
    </div>
  );
}

async function saveAttachment(params: {
  threadId: string;
  messageId: string;
  attachmentId: string;
  setSavingAttachmentId: (id: string | null) => void;
}): Promise<void> {
  params.setSavingAttachmentId(params.attachmentId);
  try {
    const result = await mailApi.getAttachmentDownloadUrl(
      params.threadId,
      params.messageId,
      params.attachmentId,
    );
    openBrowserDownload(result.url);
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'File could not be downloaded.'));
  } finally {
    params.setSavingAttachmentId(null);
  }
}

function AttachmentChip({
  attachment,
  canEdit,
  nowMs,
  retryingAttachmentId,
  saving,
  onRetryDownload,
  onSave,
}: {
  attachment: MailAttachmentRow;
  canEdit: boolean;
  nowMs: number;
  retryingAttachmentId: string | null;
  saving: boolean;
  onRetryDownload: (attachmentId: string) => void | Promise<void>;
  onSave: () => void;
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
  const canSave = canSaveMailAttachment(attachment);
  return (
    <span className="inline-flex items-center gap-1">
      <Badge variant={failed ? 'destructive' : 'secondary'} className="gap-1">
        <Paperclip size={12} aria-hidden />
        {attachment.fileName}
        {size ? ` · ${size}` : ''}
        {status ? ` · ${status}` : ''}
      </Badge>
      {canSave ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={saving}
          aria-label={`Download ${attachment.fileName}`}
          onClick={onSave}
        >
          <Download size={14} aria-hidden />
          {saving ? 'Downloading…' : 'Download'}
        </Button>
      ) : null}
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
