'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { DriveDetailPanel } from './DriveDetailPanel';
import { DRIVE_FILE_PREVIEW_ONLY_GATES } from './drive-file-allowed-actions';
import {
  DRIVE_FILE_PREVIEW_UNAVAILABLE,
  openDriveFileAssetInBrowser,
} from './resolve-drive-file-open-url';
import type { FileAsset } from '@/lib/api/drive';
import { getApiErrorMessage } from '@/lib/api-errors';

export function EntityDriveFilePreviewSheet({
  file,
  open,
  onOpenChange,
}: {
  file: FileAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const handleOpenInBrowser = useCallback(async (previewFile: FileAsset) => {
    try {
      await openDriveFileAssetInBrowser(previewFile);
    } catch (err) {
      toast.error(getApiErrorMessage(err, DRIVE_FILE_PREVIEW_UNAVAILABLE));
    }
  }, []);

  if (!open || !file) return null;

  return (
    <DriveDetailPanel
      file={file}
      open={open}
      busy={false}
      stackAboveEntitySheet
      fileActionGates={DRIVE_FILE_PREVIEW_ONLY_GATES}
      onClose={() => onOpenChange(false)}
      onRestore={() => undefined}
      onPreview={(previewFile) => void handleOpenInBrowser(previewFile)}
      onVersionUpload={() => undefined}
    />
  );
}
