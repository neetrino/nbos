'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { SheetFileAttachments } from '@/components/shared/SheetFileAttachments';
import { driveApi, type FileAsset } from '@/lib/api/drive';
import { DRIVE_LIBRARIES } from '@/features/drive/drive-options';
import type { DriveFileCardMenuHandlers } from '@/features/drive/DriveFileCard';
import {
  moveToTrashAndUnlinkFileFromEntityRecord,
  unlinkFileFromEntityRecord,
} from '@/features/drive/entity-attachment-record-actions';
import { useOptimisticEntityFileUpload } from '@/features/drive/use-optimistic-entity-file-upload';

function resolveDealFilesLibrary() {
  const library = DRIVE_LIBRARIES.find((item) => item.key === 'deals');
  if (!library) {
    throw new Error('Drive library configuration missing required "deals" entry.');
  }
  return library;
}

const DEAL_FILES_LIBRARY = resolveDealFilesLibrary();

export type DealFilePurpose = 'OFFER' | 'CONTRACT';

interface DealFilesBlockProps {
  dealId: string;
  purpose: DealFilePurpose;
  onFilesChanged?: () => void;
}

export function DealFilesBlock({ dealId, purpose, onFilesChanged }: DealFilesBlockProps) {
  const [busyFileId, setBusyFileId] = useState<string | null>(null);

  const listFiles = useCallback(async () => {
    return driveApi.listFileAssets({
      entityType: 'DEAL',
      entityId: dealId,
      purpose,
    });
  }, [dealId, purpose]);

  const {
    files,
    pending,
    loading,
    uploadFiles: uploadFilesInternal,
    refresh,
  } = useOptimisticEntityFileUpload({
    link: { entityType: 'DEAL', entityId: dealId },
    library: DEAL_FILES_LIBRARY,
    purpose,
    listFiles,
  });

  const uploadFiles = useCallback(
    async (picked: readonly File[]) => {
      await uploadFilesInternal(picked);
      onFilesChanged?.();
    },
    [onFilesChanged, uploadFilesInternal],
  );

  const runUnlink = async (file: FileAsset) => {
    setBusyFileId(file.id);
    try {
      await unlinkFileFromEntityRecord(file, 'DEAL', dealId);
      toast.success('Unlinked — file stays in the deal folder on Drive');
      await refresh();
      onFilesChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not unlink file');
    } finally {
      setBusyFileId(null);
    }
  };

  const runMoveToTrash = async (file: FileAsset) => {
    setBusyFileId(file.id);
    try {
      await moveToTrashAndUnlinkFileFromEntityRecord(file, 'DEAL', dealId);
      toast.success('File moved to Trash and unlinked from deal');
      await refresh();
      onFilesChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not move file to Trash');
    } finally {
      setBusyFileId(null);
    }
  };

  const fileMenu = (file: FileAsset): DriveFileCardMenuHandlers => ({
    busy: busyFileId === file.id,
    onOpenDetails: () => {
      const url = file.externalUrl;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    },
    onUnlinkFromRecord: () => void runUnlink(file),
    onMoveToTrash: (target) => void runMoveToTrash(target),
    onRestore: () => undefined,
  });

  return (
    <SheetFileAttachments
      files={files}
      pendingUploads={pending}
      loading={loading}
      emptyHint="You can drag a file here or click + to browse"
      onUpload={uploadFiles}
      onOpenFile={(file) => {
        const url = file.externalUrl;
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
      }}
      fileMenu={fileMenu}
    />
  );
}
