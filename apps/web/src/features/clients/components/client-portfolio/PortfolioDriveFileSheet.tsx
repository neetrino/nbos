'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { DriveDetailPanel } from '@/features/drive/DriveDetailPanel';
import type { DriveFileActionGates } from '@/features/drive/drive-file-allowed-actions';
import { driveApi, type FileAsset } from '@/lib/api/drive';
import { getApiErrorMessage } from '@/lib/api-errors';

const PORTFOLIO_DRIVE_READ_ONLY_GATES: DriveFileActionGates = {
  canShare: false,
  canCopy: false,
  canMove: false,
  canRemovePlacement: false,
  canUnlink: false,
  canUploadVersion: false,
  canRestore: false,
  canMoveToTrash: false,
};

export function PortfolioDriveFileSheet({
  file,
  open,
  onOpenChange,
}: {
  file: FileAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const handlePreview = useCallback(async (previewFile: FileAsset) => {
    try {
      const { url } = await driveApi.getFileAssetPreviewUrl(previewFile.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Preview unavailable.'));
    }
  }, []);

  if (!open || !file) return null;

  return (
    <DriveDetailPanel
      file={file}
      open={open}
      busy={false}
      stackAboveEntitySheet
      fileActionGates={PORTFOLIO_DRIVE_READ_ONLY_GATES}
      onClose={() => onOpenChange(false)}
      onRestore={() => undefined}
      onPreview={(previewFile) => void handlePreview(previewFile)}
      onVersionUpload={(_file, _event) => undefined}
    />
  );
}
