'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { SheetFileAttachments } from '@/components/shared/SheetFileAttachments';
import { driveApi, type FileAsset } from '@/lib/api/drive';
import { DRIVE_LIBRARIES } from '@/features/drive/drive-options';
import type { DriveFileCardMenuHandlers } from '@/features/drive/DriveFileCard';
import {
  archiveAndUnlinkFileFromEntityRecord,
  unlinkFileFromEntityRecord,
} from '@/features/drive/entity-attachment-record-actions';
import { useOptimisticEntityFileUpload } from '@/features/drive/use-optimistic-entity-file-upload';

const DEAL_FILES_LIBRARY = DRIVE_LIBRARIES.find((lib) => lib.key === 'deals');

export type DealFilePurpose = 'OFFER' | 'CONTRACT';

interface DealFilesBlockProps {
  dealId: string;
  purpose: DealFilePurpose;
}

export function DealFilesBlock({ dealId, purpose }: DealFilesBlockProps) {
  const [busyFileId, setBusyFileId] = useState<string | null>(null);

  const listFiles = useCallback(async () => {
    return driveApi.listFileAssets({
      entityType: 'DEAL',
      entityId: dealId,
      purpose,
    });
  }, [dealId, purpose]);

  const library = DEAL_FILES_LIBRARY;
  if (!library) {
    return null;
  }

  const { files, pending, loading, uploadFiles, refresh } = useOptimisticEntityFileUpload({
    link: { entityType: 'DEAL', entityId: dealId },
    library,
    purpose,
    listFiles,
  });

  const runUnlink = async (file: FileAsset) => {
    setBusyFileId(file.id);
    try {
      await unlinkFileFromEntityRecord(file, 'DEAL', dealId);
      toast.success('Unlinked — file stays in the deal folder on Drive');
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not unlink file');
    } finally {
      setBusyFileId(null);
    }
  };

  const runArchive = async (file: FileAsset) => {
    setBusyFileId(file.id);
    try {
      await archiveAndUnlinkFileFromEntityRecord(file, 'DEAL', dealId);
      toast.success('File archived and unlinked from deal');
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not archive file');
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
    onArchive: (target) => void runArchive(target),
    onRestore: () => undefined,
  });

  return (
    <SheetFileAttachments
      files={files}
      pendingUploads={pending}
      loading={loading}
      uploadBarLabel="You can drag a file here or click to browse"
      onUpload={uploadFiles}
      onOpenFile={(file) => {
        const url = file.externalUrl;
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
      }}
      fileMenu={fileMenu}
    />
  );
}
