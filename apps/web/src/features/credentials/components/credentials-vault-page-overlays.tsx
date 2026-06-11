'use client';

import { CredentialFormSheet } from '@/features/credentials/components/credential-form-sheet';
import { CredentialStepUpDialog } from '@/features/credentials/components/credential-step-up-dialog';
import { DeleteCredentialDialog } from '@/features/credentials/components/DeleteCredentialDialog';
import { PermanentDeleteCredentialDialog } from '@/features/credentials/components/PermanentDeleteCredentialDialog';
import type { CredentialDeleteTarget } from '@/features/credentials/hooks/use-credentials-vault-page';
import type { CredentialTileCopyTarget } from '@/features/credentials/hooks/use-credentials-vault-page';
import type { CredentialDetail } from '@/lib/api/credentials';
import type { CredentialFolder } from '@/lib/api/credentials';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';

export interface CredentialsVaultPageOverlaysProps {
  activeTab: CredentialVaultScope;
  sheetOpen: boolean;
  sheetCredentialId: string | null;
  sheetInitialItem: CredentialListItem | null;
  createPresetCategory: string | undefined;
  initialFolderId?: string | null;
  folderOptions: CredentialFolder[];
  deleteTarget: CredentialDeleteTarget | null;
  purgeTarget: CredentialDeleteTarget | null;
  tileCopyTarget: CredentialTileCopyTarget | null;
  onCloseSheet: (open: boolean) => void;
  onCredentialCreated: (created: CredentialDetail) => void;
  onSaved: () => void;
  onRequestArchive: (id: string, name: string) => void;
  onDeleteTargetChange: (open: boolean) => void;
  onPurgeTargetChange: (open: boolean) => void;
  onTileCopyOpenChange: (open: boolean) => void;
  onTileCopyConfirm: (password: string) => void | Promise<void>;
}

export function CredentialsVaultPageOverlays({
  activeTab,
  sheetOpen,
  sheetCredentialId,
  sheetInitialItem,
  createPresetCategory,
  initialFolderId,
  folderOptions,
  deleteTarget,
  purgeTarget,
  tileCopyTarget,
  onCloseSheet,
  onCredentialCreated,
  onSaved,
  onRequestArchive,
  onDeleteTargetChange,
  onPurgeTargetChange,
  onTileCopyOpenChange,
  onTileCopyConfirm,
}: CredentialsVaultPageOverlaysProps) {
  return (
    <>
      <CredentialFormSheet
        open={sheetOpen}
        onOpenChange={onCloseSheet}
        credentialId={sheetCredentialId}
        initialItem={sheetInitialItem}
        vaultScope={activeTab}
        initialCategory={createPresetCategory}
        initialFolderId={sheetCredentialId ? undefined : initialFolderId}
        folderOptions={folderOptions}
        presetKey={
          sheetCredentialId ??
          `create-${createPresetCategory ?? ''}-${initialFolderId ?? ''}-${activeTab}`
        }
        continueAfterCreate
        onCreated={onCredentialCreated}
        onSaved={onSaved}
        onRequestArchive={onRequestArchive}
      />

      <CredentialStepUpDialog
        open={tileCopyTarget !== null}
        onOpenChange={onTileCopyOpenChange}
        title="Unlock vault to copy secret"
        onConfirm={onTileCopyConfirm}
      />

      <DeleteCredentialDialog
        credentialId={deleteTarget?.id ?? null}
        credentialName={deleteTarget?.name ?? null}
        open={deleteTarget !== null}
        onOpenChange={onDeleteTargetChange}
        onDeleted={onSaved}
      />

      <PermanentDeleteCredentialDialog
        credentialId={purgeTarget?.id ?? null}
        credentialName={purgeTarget?.name ?? null}
        criticality={purgeTarget?.criticality ?? null}
        open={purgeTarget !== null}
        onOpenChange={onPurgeTargetChange}
        onDeleted={onSaved}
      />
    </>
  );
}
