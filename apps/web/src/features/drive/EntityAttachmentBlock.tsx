'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SheetFileAttachments } from '@/components/shared/SheetFileAttachments';
import { driveApi, type FileAsset } from '@/lib/api/drive';
import { DRIVE_LIBRARIES, type DriveLibraryKey } from './drive-options';
import type { DriveFileCardMenuHandlers } from './DriveFileCard';
import { findEntityFileLink } from './entity-attachment-utils';
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
  const [detachTarget, setDetachTarget] = useState<FileAsset | null>(null);

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

  const handleDetachOnly = async () => {
    if (!detachTarget) return;
    const link = findEntityFileLink(detachTarget, entityType, entityId);
    if (!link) {
      toast.error('File is not linked to this record.');
      setDetachTarget(null);
      return;
    }
    setBusyFileId(detachTarget.id);
    try {
      await driveApi.unlinkFileAsset(detachTarget.id, link.id);
      toast.success('File detached from record');
      setDetachTarget(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not detach file');
    } finally {
      setBusyFileId(null);
    }
  };

  const handleArchive = async (file: FileAsset) => {
    setBusyFileId(file.id);
    try {
      await driveApi.archiveFileAsset(file.id);
      toast.success('File archived in Drive');
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
    onUnlinkFromRecord: () => setDetachTarget(file),
    onArchive: (target) => void handleArchive(target),
    onRestore: () => undefined,
  });

  return (
    <>
      <SheetFileAttachments
        files={files}
        pendingUploads={pending}
        loading={loading}
        uploadBarLabel={emptyHint}
        onUpload={uploadFiles}
        onOpenFile={(file) => {
          const url = file.externalUrl;
          if (url) window.open(url, '_blank', 'noopener,noreferrer');
        }}
        fileMenu={fileMenu}
      />

      <Dialog
        open={Boolean(detachTarget)}
        onOpenChange={(open: boolean) => {
          if (!open) setDetachTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Remove file from record?</DialogTitle>
            <DialogDescription>
              Choose whether to keep the file in Drive or archive it completely.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setDetachTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" onClick={() => void handleDetachOnly()}>
              Detach, keep in Drive
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!detachTarget) return;
                void handleArchive(detachTarget);
                setDetachTarget(null);
              }}
            >
              Archive file
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
