'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { SheetPendingUpload } from '@/components/shared/sheet-pending-upload.types';
import type { FileAsset } from '@/lib/api/drive';
import { uploadOneDriveFileToEntity } from './drive-entity-upload';
import type { DriveEntityUploadLink } from './drive-entity-upload';
import type { DriveLibraryOption } from './drive-options';

function previewUrlForFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return null;
  return URL.createObjectURL(file);
}

function revokePreview(item: SheetPendingUpload) {
  if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
}

interface UseOptimisticEntityFileUploadParams {
  link: DriveEntityUploadLink;
  library: DriveLibraryOption;
  purpose?: string;
  listFiles: () => Promise<FileAsset[]>;
}

export function useOptimisticEntityFileUpload({
  link,
  library,
  purpose,
  listFiles,
}: UseOptimisticEntityFileUploadParams) {
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [pending, setPending] = useState<SheetPendingUpload[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const rows = await listFiles();
    setFiles(rows);
    return rows;
  }, [listFiles]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await refresh();
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    void load();
  }, [load]);

  const removePending = useCallback((localId: string) => {
    setPending((current) => {
      const target = current.find((item) => item.localId === localId);
      if (target) revokePreview(target);
      return current.filter((item) => item.localId !== localId);
    });
  }, []);

  const markPendingError = useCallback((localId: string) => {
    setPending((current) =>
      current.map((item) => (item.localId === localId ? { ...item, status: 'error' } : item)),
    );
  }, []);

  const uploadFiles = useCallback(
    async (picked: readonly File[]) => {
      if (picked.length === 0) return;

      const batch: SheetPendingUpload[] = picked.map((file) => ({
        localId: crypto.randomUUID(),
        displayName: file.name,
        previewUrl: previewUrlForFile(file),
        status: 'uploading',
      }));
      setPending((current) => [...current, ...batch]);

      const outcomes = await Promise.allSettled(
        picked.map((file) => uploadOneDriveFileToEntity(file, link, library, { purpose })),
      );

      let failed = 0;
      outcomes.forEach((outcome, index) => {
        const pendingItem = batch[index];
        if (!pendingItem) return;
        const localId = pendingItem.localId;
        if (outcome.status === 'fulfilled') {
          removePending(localId);
          return;
        }
        failed += 1;
        markPendingError(localId);
      });

      try {
        await refresh();
      } catch {
        /* list refresh failed; pending state still reflects upload result */
      }

      if (failed === 0) {
        if (picked.length === 1) toast.success('File attached');
        else toast.success(`${picked.length} files attached`);
      } else if (failed < picked.length) {
        toast.warning(`${picked.length - failed} attached, ${failed} failed`);
      } else {
        toast.error('Upload failed');
      }
    },
    [library, link, markPendingError, purpose, refresh, removePending],
  );

  return { files, pending, loading, uploadFiles, refresh };
}
