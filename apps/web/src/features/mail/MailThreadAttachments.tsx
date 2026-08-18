'use client';

import { Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/features/drive/drive-format';
import type { MailAttachmentRow } from '@/lib/api/mail';

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

export function MailThreadAttachments({
  attachments,
  canEdit,
  retryingAttachmentId,
  onRetryDownload,
}: MailThreadAttachmentsProps) {
  if (attachments.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {attachments.map((attachment) => {
        const size = attachmentSizeLabel(attachment.sizeBytes);
        const status = statusLabel(attachment.downloadStatus);
        const failed = attachment.downloadStatus === 'FAILED';
        return (
          <span key={attachment.id} className="inline-flex items-center gap-1">
            <Badge variant={failed ? 'destructive' : 'secondary'} className="gap-1">
              <Paperclip size={12} aria-hidden />
              {attachment.fileName}
              {size ? ` · ${size}` : ''}
              {status ? ` · ${status}` : ''}
            </Badge>
            {failed && canEdit ? (
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
      })}
    </div>
  );
}
