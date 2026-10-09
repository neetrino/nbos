'use client';

import { useState } from 'react';
import {
  MESSENGER_COMPOSER_FILE_MAX_COUNT,
  uploadMessengerComposerFile,
} from './messenger-composer-files';

type PendingAttachment = { file: File; previewUrl: string | null };

export function useComposerFiles() {
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return {
    pending,
    uploading,
    error,
    pick: (picked: File[]) => {
      setError(null);
      setPending((current) =>
        [...current, ...picked.map(toPendingAttachment)].slice(
          0,
          MESSENGER_COMPOSER_FILE_MAX_COUNT,
        ),
      );
    },
    remove: (index: number) => {
      setPending((current) => {
        const target = current[index];
        if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
        return current.filter((_, itemIndex) => itemIndex !== index);
      });
    },
    clear: () => {
      setError(null);
      setPending((current) => {
        revokePreviews(current);
        return [];
      });
    },
    send: async (
      employeeId: string | null,
      caption: string | undefined,
      onSend: (fileAssetIds: string[], caption?: string) => void,
    ) => {
      if (!employeeId && pending.length > 0) {
        setError('Could not upload that file.');
        return;
      }
      setUploading(true);
      setError(null);
      try {
        const ids = await uploadPending(employeeId, pending);
        revokePreviews(pending);
        setPending([]);
        onSend(ids, caption);
      } catch (caught: unknown) {
        setError(uploadFailure(caught));
      } finally {
        setUploading(false);
      }
    },
  };
}

async function uploadPending(
  employeeId: string | null,
  pending: PendingAttachment[],
): Promise<string[]> {
  if (!employeeId) return [];
  return Promise.all(pending.map((item) => uploadMessengerComposerFile(employeeId, item.file)));
}

function toPendingAttachment(file: File): PendingAttachment {
  const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
  return { file, previewUrl };
}

function revokePreviews(items: PendingAttachment[]): void {
  for (const item of items) {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  }
}

function uploadFailure(error: unknown): string {
  if (!error || typeof error !== 'object' || !('response' in error)) {
    return error instanceof Error ? error.message : 'Could not upload that file.';
  }
  const message = (error as { response?: { data?: { message?: unknown } } }).response?.data
    ?.message;
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message) && typeof message[0] === 'string') return message[0];
  return 'Could not upload that file.';
}
