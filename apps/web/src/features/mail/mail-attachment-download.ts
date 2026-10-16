import type { MailAttachmentRow } from '@/lib/api/mail';

/** A stored file the reader can save to their computer. */
export function canSaveMailAttachment(
  attachment: Pick<MailAttachmentRow, 'downloadStatus' | 'fileAssetId'>,
): boolean {
  return attachment.downloadStatus === 'READY' && Boolean(attachment.fileAssetId);
}

/** Opens a short-lived attachment URL so the browser saves the file. */
export function openBrowserDownload(url: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
