'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SheetFileAttachments } from '@/components/shared/SheetFileAttachments';
import { driveApi, type FileAsset } from '@/lib/api/drive';
import { DRIVE_LIBRARIES } from '@/features/drive/drive-options';
import type { DriveFileCardMenuHandlers } from '@/features/drive/DriveFileCard';
import { findEntityFileLink } from '@/features/drive/entity-attachment-utils';
import { useOptimisticEntityFileUpload } from '@/features/drive/use-optimistic-entity-file-upload';

const DEAL_FILES_LIBRARY = DRIVE_LIBRARIES.find((lib) => lib.key === 'deals');

export type DealFilePurpose = 'OFFER' | 'CONTRACT';

interface DealFilesBlockProps {
  dealId: string;
  purpose: DealFilePurpose;
}

export function DealFilesBlock({ dealId, purpose }: DealFilesBlockProps) {
  const [busyFileId, setBusyFileId] = useState<string | null>(null);
  const [detachTarget, setDetachTarget] = useState<FileAsset | null>(null);

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

  const handleDetachOnly = async () => {
    if (!detachTarget) return;
    const link = findEntityFileLink(detachTarget, 'DEAL', dealId);
    if (!link) {
      toast.error('File is not linked to this record.');
      setDetachTarget(null);
      return;
    }
    setBusyFileId(detachTarget.id);
    try {
      await driveApi.unlinkFileAsset(detachTarget.id, link.id);
      toast.success('File detached from deal');
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
        uploadBarLabel="You can drag a file here or click to browse"
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
            <DialogTitle>Remove file from deal?</DialogTitle>
            <DialogDescription>
              Detach keeps the file in Drive; archive removes it from active use.
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
