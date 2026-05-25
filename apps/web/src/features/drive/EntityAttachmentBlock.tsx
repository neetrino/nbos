'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { SheetFileAttachments } from '@/components/shared/SheetFileAttachments';
import { driveApi, type FileAsset } from '@/lib/api/drive';
import { DRIVE_LIBRARIES, type DriveLibraryKey } from './drive-options';
import type { DriveFileCardMenuHandlers } from './DriveFileCard';
import {
  archiveAndUnlinkFileFromEntityRecord,
  unlinkFileFromEntityRecord,
} from './entity-attachment-record-actions';
import { useOptimisticEntityFileUpload } from './use-optimistic-entity-file-upload';

const ENTITY_ATTACHMENT_TILE_LIMIT = 12;

interface EntityAttachmentBlockProps {
  entityType: string;
  entityId: string;
  libraryKey?: DriveLibraryKey;
  purpose?: string;
  purposes?: readonly string[];
  emptyHint?: string;
}

function resolveLibrary(key: DriveLibraryKey) {
  const lib = DRIVE_LIBRARIES.find((item) => item.key === key);
  if (!lib) {
    throw new Error(`Drive library '${key}' is missing.`);
  }
  return lib;
}

export function EntityAttachmentBlock({
  entityType,
  entityId,
  libraryKey = 'deals',
  purpose,
  purposes,
  emptyHint = 'You can drag a file here or click to browse',
}: EntityAttachmentBlockProps) {
  const library = resolveLibrary(libraryKey);
  const uploadPurpose = purpose ?? library.purposes?.[0] ?? 'OTHER';
  const [busyFileId, setBusyFileId] = useState<string | null>(null);

  const listFiles = useCallback(async () => {
    const rows = await driveApi.listFileAssets({ entityType, entityId, purpose });
    const filtered = purposes?.length
      ? rows.filter((row) => row.purpose && purposes.includes(row.purpose))
      : rows;
    return filtered.slice(0, ENTITY_ATTACHMENT_TILE_LIMIT);
  }, [entityId, entityType, purpose, purposes]);

  const { files, pending, loading, uploadFiles, refresh } = useOptimisticEntityFileUpload({
    link: { entityType, entityId },
    library,
    purpose: uploadPurpose,
    listFiles,
  });

  const runUnlink = async (file: FileAsset) => {
    setBusyFileId(file.id);
    try {
      await unlinkFileFromEntityRecord(file, entityType, entityId);
      toast.success('Unlinked — file stays in Drive');
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
      await archiveAndUnlinkFileFromEntityRecord(file, entityType, entityId);
      toast.success('File archived and unlinked from record');
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
      emptyHint={emptyHint}
      onUpload={uploadFiles}
      onOpenFile={(file) => {
        const url = file.externalUrl;
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
      }}
      fileMenu={fileMenu}
    />
  );
}
