'use client';

import { useCredentialFormSheetState } from '@/features/credentials/hooks/use-credential-form-sheet-state';
import { useCredentialFormSheetActions } from '@/features/credentials/hooks/use-credential-form-sheet-actions';
import { useEnvBundleKeyPreview } from '@/features/credentials/hooks/use-env-bundle-key-preview';
import { useCredentialVaultSession } from '@/features/credentials/hooks/use-credential-vault-session';
import type { CredentialFormSheetProps } from '@/features/credentials/components/credential-form-sheet-types';

export function useCredentialFormSheet(props: CredentialFormSheetProps) {
  const state = useCredentialFormSheetState(props);
  const vault = useCredentialVaultSession();
  const actions = useCredentialFormSheetActions(
    props,
    {
      isCreate: state.isCreate,
      credentialId: state.credentialId,
      name: state.name,
      category: state.category,
      credentialType: state.credentialType,
      criticality: state.criticality,
      providerId: state.providerId,
      url: state.url,
      login: state.login,
      phones: state.phones,
      appStorePlatform: state.appStorePlatform,
      password: state.password,
      passphrase: state.passphrase,
      apiKey: state.apiKey,
      envData: state.envData,
      setEnvData: state.setEnvData,
      setEnvSnap: state.setEnvSnap,
      comment: state.comment,
      accessLevel: state.accessLevel,
      nextRotationAt: state.nextRotationAt,
      manualGrants: state.manualGrants,
      folderId: state.folderId,
      folderEditable: state.folderEditable,
      stepUpField: state.stepUpField,
      stepUpMode: state.stepUpMode,
      setStepUpField: state.setStepUpField,
      setStepUpMode: state.setStepUpMode,
      setRevealed: state.setRevealed,
      loadDetail: state.loadDetail,
      promoteAfterCreate: state.promoteAfterCreate,
      commitFormSnapshot: state.commitFormSnapshot,
      captureFormRollback: state.captureFormRollback,
      orphanedSecretsAcknowledged: state.orphanedSecretsAcknowledged,
      detailCredentialType: state.detailCredentialType,
      clearOrphanedSecretsAcknowledged: state.clearOrphanedSecretsAcknowledged,
    },
    vault,
  );

  useEnvBundleKeyPreview({
    open: props.open,
    detailHydrated: state.detailHydrated,
    credentialId: state.credentialId,
    credentialType: state.credentialType,
    criticality: state.criticality,
    envData: state.envData,
    hasStoredBundle: Boolean(state.detail?.secretsPresent?.envData),
    revealedEnv: state.revealed.envData,
    hydrateKeys: actions.hydrateEnvBundleKeyPreview,
  });

  return {
    ...state,
    saving: actions.saving,
    handleSave: actions.handleSave,
    runStepUp: actions.runStepUp,
    requestSecretAction: actions.requestSecretAction,
    copySecretField: actions.copySecretField,
    downloadEnvBundle: actions.downloadEnvBundle,
    submitLabel: props.submitLabel ?? 'Save',
    folderOptions: state.scopedFolderOptions,
    onOpenChange: props.onOpenChange,
  };
}

export type { CredentialFormSheetProps } from '@/features/credentials/components/credential-form-sheet-types';
