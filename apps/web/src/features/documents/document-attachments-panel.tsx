'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Download, Loader2, Paperclip, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadFileAssetForDocument } from '@/features/documents/document-image-upload';
import { DOCUMENT_ATTACHMENT_MAX_BYTES } from '@/features/documents/document-upload.constants';
import { documentsApi, type DocumentAttachmentItem } from '@/lib/api/documents';
import { driveApi } from '@/lib/api/drive';
import { getApiErrorMessage } from '@/lib/api-errors';

export interface DocumentAttachmentsPanelProps {
  documentId: string;
  attachments: DocumentAttachmentItem[];
  canEdit: boolean;
  canUseDrive: boolean;
  onChanged: () => void;
}

export function DocumentAttachmentsPanel({
  documentId,
  attachments,
  canEdit,
  canUseDrive,
  onChanged,
}: DocumentAttachmentsPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = () => {
    fileRef.current?.click();
  };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { fileAssetId } = await uploadFileAssetForDocument(
        documentId,
        file,
        DOCUMENT_ATTACHMENT_MAX_BYTES,
      );
      await documentsApi.addDocumentAttachment(documentId, {
        fileAssetId,
        purpose: 'ATTACHMENT',
      });
      onChanged();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not add attachment.'));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (attachmentId: string) => {
    setBusy(true);
    setError(null);
    try {
      await documentsApi.removeDocumentAttachment(documentId, attachmentId);
      onChanged();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not remove attachment.'));
    } finally {
      setBusy(false);
    }
  };

  const handleOpen = async (fileAssetId: string) => {
    setError(null);
    try {
      const { url } = await driveApi.getFileAssetPreviewUrl(fileAssetId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Could not open file preview.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Attachments</h3>
        {canEdit && canUseDrive ? (
          <>
            <input
              ref={fileRef}
              type="file"
              className="sr-only"
              aria-hidden
              onChange={(ev) => void handleFile(ev)}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={busy}
              onClick={handlePick}
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
              Add file
            </Button>
          </>
        ) : null}
      </div>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
      {attachments.length === 0 ? (
        <p className="text-muted-foreground text-sm">No attachments yet.</p>
      ) : (
        <ul className="divide-border divide-y text-sm">
          {attachments.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{row.fileAsset.displayName}</p>
                <p className="text-muted-foreground text-xs capitalize">
                  {row.purpose.toLowerCase().replace(/_/g, ' ')}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="size-8"
                  aria-label="Open or download"
                  onClick={() => void handleOpen(row.fileAsset.id)}
                >
                  <Download size={16} />
                </Button>
                {canEdit ? (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive size-8"
                    aria-label="Remove attachment"
                    disabled={busy}
                    onClick={() => void handleRemove(row.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
