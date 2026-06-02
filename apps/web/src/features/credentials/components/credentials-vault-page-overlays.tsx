'use client';

import { CredentialFormSheet } from '@/features/credentials/components/credential-form-sheet';
import { CredentialStepUpDialog } from '@/features/credentials/components/credential-step-up-dialog';
import { DeleteCredentialDialog } from '@/features/credentials/components/DeleteCredentialDialog';
import { PermanentDeleteCredentialDialog } from '@/features/credentials/components/PermanentDeleteCredentialDialog';
import type { CredentialDeleteTarget } from '@/features/credentials/hooks/use-credentials-vault-page';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';
import { credentialsApi } from '@/lib/api/credentials';
import { toast } from 'sonner';

export interface CredentialsVaultPageOverlaysProps {
  activeTab: CredentialVaultScope;
  sheetOpen: boolean;
  sheetCredentialId: string | null;
  createPresetCategory: string | undefined;
  deleteTarget: CredentialDeleteTarget | null;
  purgeTarget: CredentialDeleteTarget | null;
  tileCopyCredentialId: string | null;
  onCloseSheet: (open: boolean) => void;
  onSaved: () => void;
  onRequestArchive: (id: string, name: string) => void;
  onDeleteTargetChange: (open: boolean) => void;
  onPurgeTargetChange: (open: boolean) => void;
  onTileCopyOpenChange: (open: boolean) => void;
  onPasswordCopied: (credentialId: string) => void;
}

export function CredentialsVaultPageOverlays({
  activeTab,
  sheetOpen,
  sheetCredentialId,
  createPresetCategory,
  deleteTarget,
  purgeTarget,
  tileCopyCredentialId,
  onCloseSheet,
  onSaved,
  onRequestArchive,
  onDeleteTargetChange,
  onPurgeTargetChange,
  onTileCopyOpenChange,
  onPasswordCopied,
}: CredentialsVaultPageOverlaysProps) {
  return (
    <>
      <CredentialFormSheet
        open={sheetOpen}
        onOpenChange={onCloseSheet}
        credentialId={sheetCredentialId}
        vaultScope={activeTab}
        initialCategory={createPresetCategory}
        presetKey={`${createPresetCategory ?? ''}-${activeTab}`}
        onSaved={onSaved}
        onRequestArchive={onRequestArchive}
      />

      <CredentialStepUpDialog
        open={tileCopyCredentialId !== null}
        onOpenChange={onTileCopyOpenChange}
        title="Confirm to copy password"
        onConfirm={async (pwd) => {
          if (!tileCopyCredentialId) return;
          const flashId = tileCopyCredentialId;
          const { value } = await credentialsApi.copySecret(flashId, 'password', pwd);
          await navigator.clipboard.writeText(value);
          toast.success('Password copied');
          onTileCopyOpenChange(false);
          onPasswordCopied(flashId);
        }}
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
