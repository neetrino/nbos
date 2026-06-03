'use client';

import { useCredentialFormSheetState } from '@/features/credentials/hooks/use-credential-form-sheet-state';
import { useCredentialFormSheetActions } from '@/features/credentials/hooks/use-credential-form-sheet-actions';
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
      comment: state.comment,
      accessLevel: state.accessLevel,
      nextRotationAt: state.nextRotationAt,
      manualGrants: state.manualGrants,
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

  return {
    ...state,
    saving: actions.saving,
    handleSave: actions.handleSave,
    runStepUp: actions.runStepUp,
    requestSecretAction: actions.requestSecretAction,
    submitLabel: props.submitLabel ?? 'Save',
    onOpenChange: props.onOpenChange,
  };
}

export type { CredentialFormSheetProps } from '@/features/credentials/components/credential-form-sheet-types';
