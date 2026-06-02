'use client';

import { useCredentialFormSheetState } from '@/features/credentials/hooks/use-credential-form-sheet-state';
import { useCredentialFormSheetActions } from '@/features/credentials/hooks/use-credential-form-sheet-actions';
import type { CredentialFormSheetProps } from '@/features/credentials/components/credential-form-sheet-types';

export function useCredentialFormSheet(props: CredentialFormSheetProps) {
  const state = useCredentialFormSheetState(props);
  const { saving, handleSave, runStepUp } = useCredentialFormSheetActions(props, {
    isCreate: state.isCreate,
    credentialId: state.credentialId,
    name: state.name,
    category: state.category,
    credentialType: state.credentialType,
    criticality: state.criticality,
    environment: state.environment,
    provider: state.provider,
    url: state.url,
    login: state.login,
    phone: state.phone,
    password: state.password,
    apiKey: state.apiKey,
    envData: state.envData,
    comment: state.comment,
    accessLevel: state.accessLevel,
    nextRotationAt: state.nextRotationAt,
    manualGrants: state.manualGrants,
    stepUpField: state.stepUpField,
    stepUpMode: state.stepUpMode,
    setRevealed: state.setRevealed,
    loadDetail: state.loadDetail,
    commitFormSnapshot: state.commitFormSnapshot,
    captureFormRollback: state.captureFormRollback,
  });

  return {
    ...state,
    saving,
    handleSave,
    runStepUp,
    submitLabel: props.submitLabel ?? 'Save',
    onOpenChange: props.onOpenChange,
  };
}

export type { CredentialFormSheetProps } from '@/features/credentials/components/credential-form-sheet-types';
