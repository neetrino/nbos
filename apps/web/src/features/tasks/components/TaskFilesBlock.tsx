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

const TASK_ATTACHMENT_PURPOSE = 'TASK_ATTACHMENT';

function resolveTaskFilesLibrary() {
  const library = DRIVE_LIBRARIES.find((item) => item.key === 'tasks');
  if (!library) {
    throw new Error('Drive library configuration missing required "tasks" entry.');
  }
  return library;
}

const TASK_FILES_LIBRARY = resolveTaskFilesLibrary();

interface TaskFilesBlockProps {
  taskId: string;
}

export function TaskFilesBlock({ taskId }: TaskFilesBlockProps) {
  const [busyFileId, setBusyFileId] = useState<string | null>(null);

  const listFiles = useCallback(async () => {
    return driveApi.listFileAssets({
      entityType: 'TASK',
      entityId: taskId,
      purpose: TASK_ATTACHMENT_PURPOSE,
    });
  }, [taskId]);

  const { files, pending, loading, uploadFiles, refresh } = useOptimisticEntityFileUpload({
    link: { entityType: 'TASK', entityId: taskId },
    library: TASK_FILES_LIBRARY,
    purpose: TASK_ATTACHMENT_PURPOSE,
    listFiles,
  });

  const runUnlink = async (file: FileAsset) => {
    setBusyFileId(file.id);
    try {
      await unlinkFileFromEntityRecord(file, 'TASK', taskId);
      toast.success('Unlinked — file stays in the task folder on Drive');
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not unlink file');
    } finally {
      setBusyFileId(null);
    }
  };

  const runMoveToTrash = async (file: FileAsset) => {
    setBusyFileId(file.id);
    try {
      await moveToTrashAndUnlinkFileFromEntityRecord(file, 'TASK', taskId);
      toast.success('File moved to Trash and unlinked from task');
      await refresh();
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
      denseTiles
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
