'use client';

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { credentialsApi, type CredentialSecretField } from '@/lib/api/credentials';
import { credentialNeedsVaultUnlock } from '@/features/credentials/constants/credential-vault-unlock';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { toast } from 'sonner';
import type { CredentialFormSheetProps } from '@/features/credentials/components/credential-form-sheet-types';

const CREATE_DEFAULT_SUCCESS_TOAST = 'Credential created';

export interface CredentialFormSheetStateSlice {
  isCreate: boolean;
  credentialId: string | null;
  name: string;
  category: string;
  credentialType: string;
  criticality: string;
  environment: string;
  provider: string;
  url: string;
  login: string;
  phone: string;
  password: string;
  apiKey: string;
  envData: string;
  comment: string;
  accessLevel: string;
  nextRotationAt: string;
  manualGrants: { employeeId: string; level: 'VIEW' | 'EDIT'; expiresAt: string | null }[];
  stepUpField: CredentialSecretField | null;
  stepUpMode: 'reveal' | 'copy';
  setStepUpField: Dispatch<SetStateAction<CredentialSecretField | null>>;
  setStepUpMode: Dispatch<SetStateAction<'reveal' | 'copy'>>;
  setRevealed: Dispatch<SetStateAction<Partial<Record<CredentialSecretField, string>>>>;
  loadDetail: () => Promise<void>;
  commitFormSnapshot: () => void;
  captureFormRollback: () => () => void;
}

export interface CredentialVaultSessionSlice {
  isUnlocked: boolean;
  refresh: () => Promise<void>;
}

function buildCredentialUpdateBody(state: CredentialFormSheetStateSlice): Record<string, unknown> {
  return {
    name: state.name.trim(),
    category: state.category,
    credentialType: state.credentialType,
    criticality: state.criticality,
    environment: state.environment.trim() || undefined,
    provider: state.provider.trim() || undefined,
    url: state.url.trim() || undefined,
    login: state.login.trim() || undefined,
    phone: state.phone.trim() || undefined,
    password: state.password.trim() || undefined,
    apiKey: state.apiKey.trim() || undefined,
    envData: state.envData.trim() || undefined,
    secureNotes: state.comment.trim() || undefined,
    accessLevel: state.accessLevel,
    nextRotationAt: state.nextRotationAt || null,
  };
}

export function useCredentialFormSheetActions(
  props: CredentialFormSheetProps,
  state: CredentialFormSheetStateSlice,
  vault: CredentialVaultSessionSlice,
) {
  const { onOpenChange, projectId, productId, successToast, onCreated, onSaved } = props;
  const { creatorId } = useTaskCreatorId();
  const [saving, setSaving] = useState(false);

  const saveEditInBackground = useCallback(() => {
    const credentialId = state.credentialId;
    if (!credentialId) return;

    const rollback = state.captureFormRollback();
    const body = buildCredentialUpdateBody(state);
    const grants = state.manualGrants.map((g) => ({
      employeeId: g.employeeId,
      level: g.level,
      expiresAt: g.expiresAt,
    }));
    state.commitFormSnapshot();

    void (async () => {
      try {
        await Promise.all([
          credentialsApi.update(credentialId, body),
          credentialsApi.replaceManualAccess(credentialId, grants),
        ]);
        toast.success('Credential saved');
        onSaved?.();
      } catch (err) {
        rollback();
        toast.error(err instanceof Error ? err.message : 'Could not save');
      }
    })();
  }, [onSaved, state]);

  const handleSave = useCallback(async () => {
    if (!state.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (state.isCreate) {
      setSaving(true);
      try {
        const body: Record<string, unknown> = {
          ...buildCredentialUpdateBody(state),
          manualGrants:
            state.manualGrants.length > 0
              ? state.manualGrants.map((g) => ({
                  employeeId: g.employeeId,
                  level: g.level,
                  expiresAt: g.expiresAt,
                }))
              : undefined,
        };
        if (projectId) body.projectId = projectId;
        if (productId) body.productId = productId;
        if (state.accessLevel === 'PERSONAL' && creatorId) body.ownerId = creatorId;
        const created = await credentialsApi.create(body);
        if (successToast !== false) toast.success(successToast ?? CREATE_DEFAULT_SUCCESS_TOAST);
        onOpenChange(false);
        onCreated?.(created);
        onSaved?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not save');
      } finally {
        setSaving(false);
      }
      return;
    }

    if (state.credentialId) {
      saveEditInBackground();
    }
  }, [
    creatorId,
    onCreated,
    onOpenChange,
    onSaved,
    productId,
    projectId,
    saveEditInBackground,
    state,
    successToast,
  ]);

  const executeSecretAction = useCallback(
    async (field: CredentialSecretField, mode: 'reveal' | 'copy', pwd?: string) => {
      if (!state.credentialId) return;
      const needsUnlock = credentialNeedsVaultUnlock(state.criticality) && !vault.isUnlocked;
      const stepUpPassword = needsUnlock ? pwd : undefined;
      if (needsUnlock && !stepUpPassword) return;

      try {
        if (mode === 'reveal') {
          const { value } = await credentialsApi.revealSecret(
            state.credentialId,
            field,
            stepUpPassword,
          );
          state.setRevealed((p) => ({ ...p, [field]: value }));
        } else {
          const { value } = await credentialsApi.copySecret(
            state.credentialId,
            field,
            stepUpPassword,
          );
          await navigator.clipboard.writeText(value);
          toast.success('Copied');
        }
        if (stepUpPassword) await vault.refresh();
      } catch {
        toast.error('Could not access secret');
      }
    },
    [state, vault],
  );

  const requestSecretAction = useCallback(
    (field: CredentialSecretField, mode: 'reveal' | 'copy') => {
      if (!credentialNeedsVaultUnlock(state.criticality) || vault.isUnlocked) {
        void executeSecretAction(field, mode);
        return;
      }
      state.setStepUpField(field);
      state.setStepUpMode(mode);
    },
    [executeSecretAction, state, vault.isUnlocked],
  );

  const runStepUp = useCallback(
    async (pwd: string) => {
      if (!state.stepUpField) return;
      await executeSecretAction(state.stepUpField, state.stepUpMode, pwd);
      state.setStepUpField(null);
    },
    [executeSecretAction, state],
  );

  return { saving, handleSave, runStepUp, requestSecretAction };
}
