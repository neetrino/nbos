'use client';

import { useMemo } from 'react';
import { driveApi, type DriveFolder, type FileAsset } from '@/lib/api/drive';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DriveAccessGrantsPanel, type DriveAccessGrantsApi } from './drive-access-grants-panel';

export type DriveAccessDialogTarget =
  | { kind: 'file'; file: FileAsset }
  | { kind: 'folder'; folder: DriveFolder };

export function DriveAccessDialog({
  target,
  onClose,
  onChanged,
}: {
  target: DriveAccessDialogTarget | null;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const api = useMemo((): DriveAccessGrantsApi | null => {
    if (!target) return null;
    if (target.kind === 'file') {
      const fileId = target.file.id;
      return {
        listGrants: () => driveApi.listFileAssetGrants(fileId),
        createGrant: (body) => driveApi.createFileAssetGrant(fileId, body),
        revokeGrant: (grantId) => driveApi.revokeFileAssetGrant(fileId, grantId),
      };
    }
    const folderId = target.folder.id;
    return {
      listGrants: () => driveApi.listFolderGrants(folderId),
      createGrant: (body) => driveApi.createFolderGrant(folderId, body),
      revokeGrant: (grantId) => driveApi.revokeFolderGrant(folderId, grantId),
    };
  }, [target]);

  const title =
    target?.kind === 'folder'
      ? `Access — ${target.folder.name}`
      : target?.kind === 'file'
        ? `Access — ${target.file.displayName}`
        : '';

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-border/60 border-b px-5 py-4">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          <p className="text-muted-foreground text-xs font-normal">Manual access</p>
        </DialogHeader>
        <div className="px-5 py-4">
          {api && target ? (
            <DriveAccessGrantsPanel subjectKind={target.kind} api={api} onChanged={onChanged} />
          ) : null}
        </div>
        <DialogFooter className="border-border/60 flex-row justify-end gap-2 border-t px-5 py-3">
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
