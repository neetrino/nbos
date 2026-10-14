'use client';

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';
import type { MailAttachmentRow } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { canSaveMailAttachment } from './mail-attachment-download';
import { MAIL_COMPOSE_ATTACHMENT_MAX_COUNT } from './mail-compose-attachment.constants';
import { uploadMailComposeFile } from './mail-compose-file-upload';

export interface MailComposeAttachmentItem {
  localId: string;
  fileName: string;
  status: 'uploading' | 'ready' | 'failed';
  fileAssetId?: string;
}

export function useMailComposeAttachments() {
  const [items, setItems] = useState<MailComposeAttachmentItem[]>([]);
  const fileAssetIds = items.flatMap((item) => (item.fileAssetId ? [item.fileAssetId] : []));
  const uploading = items.some((item) => item.status === 'uploading');

  const hydrate = useCallback((rows: MailAttachmentRow[]) => {
    setItems(rows.filter(canSaveMailAttachment).map(toReadyItem));
  }, []);

  const remove = useCallback((localId: string) => {
    setItems((prev) => prev.filter((item) => item.localId !== localId));
  }, []);

  const addFiles = useCallback(
    async (files: File[]) => {
      const starters = takeAttachmentRoom(items.length, files);
      if (starters.length === 0) {
        return;
      }
      setItems((prev) => [...prev, ...starters.map(toUploadingItem)]);
      await Promise.all(
        starters.map((item) => finishComposeUpload(item.localId, item.file, setItems)),
      );
    },
    [items.length],
  );

  return { items, fileAssetIds, uploading, addFiles, remove, hydrate };
}

function toReadyItem(row: MailAttachmentRow): MailComposeAttachmentItem {
  return {
    localId: row.id,
    fileName: row.fileName,
    status: 'ready',
    fileAssetId: row.fileAssetId ?? undefined,
  };
}

function toUploadingItem(item: { localId: string; fileName: string }): MailComposeAttachmentItem {
  return { localId: item.localId, fileName: item.fileName, status: 'uploading' };
}

function takeAttachmentRoom(
  currentCount: number,
  files: File[],
): Array<{ localId: string; fileName: string; file: File }> {
  if (files.length === 0) {
    return [];
  }
  const room = MAIL_COMPOSE_ATTACHMENT_MAX_COUNT - currentCount;
  if (room <= 0) {
    toast.error('You can attach up to 10 files.');
    return [];
  }
  if (files.length > room) {
    toast.error('You can attach up to 10 files.');
  }
  return files.slice(0, room).map((file) => ({
    localId: crypto.randomUUID(),
    fileName: file.name,
    file,
  }));
}

async function finishComposeUpload(
  localId: string,
  file: File,
  setItems: Dispatch<SetStateAction<MailComposeAttachmentItem[]>>,
): Promise<void> {
  try {
    const fileAssetId = await uploadMailComposeFile(file);
    setItems((prev) =>
      prev.map((item) =>
        item.localId === localId ? { ...item, status: 'ready', fileAssetId } : item,
      ),
    );
  } catch (error) {
    setItems((prev) =>
      prev.map((item) => (item.localId === localId ? { ...item, status: 'failed' } : item)),
    );
    toast.error(getApiErrorMessage(error, 'File could not be attached.'));
  }
}
