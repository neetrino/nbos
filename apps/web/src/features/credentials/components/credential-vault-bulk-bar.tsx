'use client';

import { useState } from 'react';
import { Archive, Download, ListChecks, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/shared';
import { CredentialStepUpDialog } from '@/features/credentials/components/credential-step-up-dialog';
import { downloadBase64File } from '@/features/credentials/utils/download-base64-file';
import { credentialsApi } from '@/lib/api/credentials';
import { PermissionGate } from '@/lib/permissions';
import { toast } from 'sonner';

export interface CredentialVaultBulkBarProps {
  count: number;
  archivedList: boolean;
  busy: boolean;
  showSelectAll: boolean;
  selectedIds: string[];
  onSelectAll: () => void;
  onClear: () => void;
  onCompleted: () => void;
}

export function CredentialVaultBulkBar({
  count,
  archivedList,
  busy,
  showSelectAll,
  selectedIds,
  onSelectAll,
  onClear,
  onCompleted,
}: CredentialVaultBulkBarProps) {
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [acting, setActing] = useState(false);

  const runBulkArchive = async () => {
    setActing(true);
    try {
      const result = await credentialsApi.bulkArchive(selectedIds);
      const skipped = result.skipped > 0 ? ` (${result.skipped} skipped)` : '';
      toast.success(
        `Archived ${result.succeeded} credential${result.succeeded === 1 ? '' : 's'}${skipped}`,
      );
      setConfirmArchiveOpen(false);
      onClear();
      onCompleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk archive failed');
    } finally {
      setActing(false);
    }
  };

  const runBulkRestore = async () => {
    setActing(true);
    try {
      const result = await credentialsApi.bulkRestore(selectedIds);
      const skipped = result.skipped > 0 ? ` (${result.skipped} skipped)` : '';
      toast.success(
        `Restored ${result.succeeded} credential${result.succeeded === 1 ? '' : 's'}${skipped}`,
      );
      onClear();
      onCompleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk restore failed');
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
      toast.success(`Exported ${file.count} credentials`);
      setStepUpOpen(false);
    } catch {
      toast.error('Export failed');
    } finally {
      setActing(false);
    }
  };

  const disabled = busy || acting;

  return (
    <>
      <div className="border-border/70 bg-card flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium tabular-nums">{count} selected</p>
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
              Select page
            </Button>
          ) : null}
          {!archivedList ? (
            <>
              <PermissionGate module="CREDENTIALS" action="VIEW">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => setStepUpOpen(true)}
                >
                  <Download className="size-4" aria-hidden />
                  Export selected
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
                  Archive
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
                Restore
              </Button>
            </PermissionGate>
          )}
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onClear}>
            <X className="size-4" aria-hidden />
            Clear
          </Button>
        </div>
      </div>

      <DeleteConfirmDialog
        level="simple"
        open={confirmArchiveOpen}
        onOpenChange={setConfirmArchiveOpen}
        itemName={`${count} credentials`}
        title="Archive selected credentials?"
        description="Hidden from active lists. You can restore them from Archived."
        confirmLabel="Archive"
        isSubmitting={acting}
        onConfirm={() => void runBulkArchive()}
      />

      <CredentialStepUpDialog
        open={stepUpOpen}
        onOpenChange={setStepUpOpen}
        title="Confirm to export selected credentials"
        onConfirm={runBulkExport}
      />
    </>
  );
}
