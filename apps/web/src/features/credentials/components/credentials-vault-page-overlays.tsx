'use client';

import { CredentialFormSheet } from '@/features/credentials/components/credential-form-sheet';
import { CredentialStepUpDialog } from '@/features/credentials/components/credential-step-up-dialog';
import { DeleteCredentialDialog } from '@/features/credentials/components/DeleteCredentialDialog';
import { PermanentDeleteCredentialDialog } from '@/features/credentials/components/PermanentDeleteCredentialDialog';
import { credentialNeedsVaultUnlock } from '@/features/credentials/constants/credential-vault-unlock';
import type {
  CredentialDeleteTarget,
  CredentialTileCopyTarget,
} from '@/features/credentials/hooks/use-credentials-vault-page';
import { useCredentialVaultSession } from '@/features/credentials/hooks/use-credential-vault-session';
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
  tileCopyTarget: CredentialTileCopyTarget | null;
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
  tileCopyTarget,
  onCloseSheet,
  onSaved,
  onRequestArchive,
  onDeleteTargetChange,
  onPurgeTargetChange,
  onTileCopyOpenChange,
  onPasswordCopied,
}: CredentialsVaultPageOverlaysProps) {
  const vault = useCredentialVaultSession(true);

  const copyPassword = async (target: CredentialTileCopyTarget, password?: string) => {
    const needsUnlock = credentialNeedsVaultUnlock(target.criticality) && !vault.isUnlocked;
    const stepUpPassword = needsUnlock ? password : undefined;
    if (needsUnlock && !stepUpPassword) return;

    const { value } = await credentialsApi.copySecret(target.id, 'password', stepUpPassword);
    await navigator.clipboard.writeText(value);
    toast.success('Password copied');
    if (stepUpPassword) await vault.refresh();
    onTileCopyOpenChange(false);
    onPasswordCopied(target.id);
  };

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
        open={tileCopyTarget !== null}
        onOpenChange={onTileCopyOpenChange}
        title="Unlock vault to copy password"
        onConfirm={async (pwd) => {
          if (!tileCopyTarget) return;
          try {
            await copyPassword(tileCopyTarget, pwd);
          } catch {
            toast.error('Could not copy password');
          }
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

/** Copy password from vault card; opens unlock dialog only for locked HIGH/CRITICAL. */
export function useVaultPasswordCopy(
  vault: ReturnType<typeof useCredentialVaultSession>,
  onNeedUnlock: (target: CredentialTileCopyTarget) => void,
  onCopied: (credentialId: string) => void,
) {
  return async (target: CredentialTileCopyTarget) => {
    if (credentialNeedsVaultUnlock(target.criticality) && !vault.isUnlocked) {
      onNeedUnlock(target);
      return;
    }
    try {
      const { value } = await credentialsApi.copySecret(target.id, 'password');
      await navigator.clipboard.writeText(value);
      toast.success('Password copied');
      onCopied(target.id);
    } catch {
      toast.error('Could not copy password');
    }
  };
}
