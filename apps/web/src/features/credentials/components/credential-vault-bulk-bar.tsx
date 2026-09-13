'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Archive, Download, FolderMinus, FolderPlus, ListChecks, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/shared';
import { CredentialStepUpDialog } from '@/features/credentials/components/credential-step-up-dialog';
import { CredentialVaultBulkFolderPickerDialog } from '@/features/credentials/components/credential-vault-bulk-folder-picker-dialog';
import type { CredentialFolder } from '@/lib/api/credentials';
import { downloadBase64File } from '@/features/credentials/utils/download-base64-file';
import { credentialsApi } from '@/lib/api/credentials';
import { PermissionGate } from '@/lib/permissions';
import { toast } from 'sonner';

export interface CredentialVaultBulkBarProps {
  count: number;
  trashList: boolean;
  busy: boolean;
  showSelectAll: boolean;
  selectedIds: string[];
  folders?: CredentialFolder[];
  activeFolderId?: string | null;
  onSelectAll: () => void;
  onClear: () => void;
  onCompleted: () => void;
}

export function CredentialVaultBulkBar({
  count,
  trashList,
  busy,
  showSelectAll,
  selectedIds,
  folders = [],
  activeFolderId = null,
  onSelectAll,
  onClear,
  onCompleted,
}: CredentialVaultBulkBarProps) {
  const t = useTranslations('credentials');
  const tCommon = useTranslations('common');
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [confirmRemoveFolderOpen, setConfirmRemoveFolderOpen] = useState(false);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [acting, setActing] = useState(false);
  const showFolderActions = !trashList && folders.length > 0;

  const runBulkArchive = async () => {
    setActing(true);
    try {
      const result = await credentialsApi.bulkArchive(selectedIds);
      const skipped = result.skipped > 0 ? ` ${t('bulk.skipped', { count: result.skipped })}` : '';
      toast.success(`${t('bulk.archiveSuccess', { count: result.succeeded })}${skipped}`);
      setConfirmArchiveOpen(false);
      onClear();
      onCompleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('bulk.archiveFailed'));
    } finally {
      setActing(false);
    }
  };

  const runBulkRestore = async () => {
    setActing(true);
    try {
      const result = await credentialsApi.bulkRestore(selectedIds);
      const skipped = result.skipped > 0 ? ` ${t('bulk.skipped', { count: result.skipped })}` : '';
      toast.success(`${t('bulk.restoreSuccess', { count: result.succeeded })}${skipped}`);
      onClear();
      onCompleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('bulk.restoreFailed'));
    } finally {
      setActing(false);
    }
  };

  const runBulkAddToFolder = async (folderId: string) => {
    setActing(true);
    try {
      const result = await credentialsApi.bulkAddToFolder({ credentialIds: selectedIds, folderId });
      const skipped = result.skipped > 0 ? ` ${t('bulk.skipped', { count: result.skipped })}` : '';
      toast.success(`${t('bulk.moveSuccess', { count: result.succeeded })}${skipped}`);
      setFolderPickerOpen(false);
      onClear();
      onCompleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('bulk.moveFailed'));
    } finally {
      setActing(false);
    }
  };

  const runBulkRemoveFromFolder = async () => {
    setActing(true);
    try {
      const result = await credentialsApi.bulkRemoveFromFolder({
        credentialIds: selectedIds,
        folderId: activeFolderId ?? undefined,
      });
      const skipped = result.skipped > 0 ? ` ${t('bulk.skipped', { count: result.skipped })}` : '';
      const success = activeFolderId
        ? t('bulk.removeSuccessFolder', { count: result.succeeded })
        : t('bulk.removeSuccessAll', { count: result.succeeded });
      toast.success(`${success}${skipped}`);
      setConfirmRemoveFolderOpen(false);
      onClear();
      onCompleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('bulk.removeFailed'));
    } finally {
      setActing(false);
    }
  };

  const runBulkExport = async (stepUpPassword: string) => {
    setActing(true);
    try {
      const file = await credentialsApi.exportEncryptedFile({
        credentialIds: selectedIds,
        stepUpPassword,
      });
      downloadBase64File(file.filename, file.mimeType, file.contentBase64);
      toast.success(t('settings.exportSuccess', { count: file.count }));
      setStepUpOpen(false);
    } catch {
      toast.error(t('settings.exportFailed'));
    } finally {
      setActing(false);
    }
  };

  const disabled = busy || acting;

  return (
    <>
      <div className="border-border/70 bg-card flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium tabular-nums">{t('bulk.selected', { count })}</p>
        <div className="flex flex-wrap gap-2">
          {showSelectAll ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={onSelectAll}
            >
              <ListChecks className="size-4" aria-hidden />
              {t('bulk.selectPage')}
            </Button>
          ) : null}
          {!trashList ? (
            <>
              {showFolderActions ? (
                <PermissionGate module="CREDENTIALS" action="EDIT">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => setFolderPickerOpen(true)}
                  >
                    <FolderPlus className="size-4" aria-hidden />
                    {t('bulk.moveToFolder')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => setConfirmRemoveFolderOpen(true)}
                  >
                    <FolderMinus className="size-4" aria-hidden />
                    {activeFolderId ? t('bulk.removeFromFolder') : t('bulk.removeFromFolders')}
                  </Button>
                </PermissionGate>
              ) : null}
              <PermissionGate module="CREDENTIALS" action="VIEW">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => setStepUpOpen(true)}
                >
                  <Download className="size-4" aria-hidden />
                  {t('bulk.exportSelected')}
                </Button>
              </PermissionGate>
              <PermissionGate module="CREDENTIALS" action="DELETE">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => setConfirmArchiveOpen(true)}
                >
                  <Archive className="size-4" aria-hidden />
                  {t('delete.confirm')}
                </Button>
              </PermissionGate>
            </>
          ) : (
            <PermissionGate module="CREDENTIALS" action="EDIT">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => void runBulkRestore()}
              >
                <RotateCcw className="size-4" aria-hidden />
                {t('bulk.restore')}
              </Button>
            </PermissionGate>
          )}
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onClear}>
            <X className="size-4" aria-hidden />
            {t('bulk.clear')}
          </Button>
        </div>
      </div>

      <DeleteConfirmDialog
        level="simple"
        open={confirmArchiveOpen}
        onOpenChange={setConfirmArchiveOpen}
        itemName={t('bulk.itemName', { count })}
        title={t('bulk.archiveTitle')}
        description={t('bulk.archiveDescription')}
        confirmLabel={t('delete.confirm')}
        dismissLabel={tCommon('cancel')}
        isSubmitting={acting}
        onConfirm={() => void runBulkArchive()}
      />

      <CredentialStepUpDialog
        open={stepUpOpen}
        onOpenChange={setStepUpOpen}
        title={t('bulk.exportConfirm')}
        onConfirm={runBulkExport}
      />

      <CredentialVaultBulkFolderPickerDialog
        open={folderPickerOpen}
        folders={folders}
        busy={acting}
        onOpenChange={setFolderPickerOpen}
        onConfirm={(folderId) => void runBulkAddToFolder(folderId)}
      />

      <DeleteConfirmDialog
        level="simple"
        open={confirmRemoveFolderOpen}
        onOpenChange={setConfirmRemoveFolderOpen}
        itemName={t('bulk.itemName', { count })}
        title={activeFolderId ? t('bulk.removeThisFolderTitle') : t('bulk.removeAllFoldersTitle')}
        description={
          activeFolderId ? t('bulk.removeThisFolderBody') : t('bulk.removeAllFoldersBody')
        }
        confirmLabel={t('bulk.removeConfirm')}
        dismissLabel={tCommon('cancel')}
        isSubmitting={acting}
        onConfirm={() => void runBulkRemoveFromFolder()}
      />
    </>
  );
}
