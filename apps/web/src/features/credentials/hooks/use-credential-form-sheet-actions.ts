'use client';

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { credentialsApi, type CredentialSecretField } from '@/lib/api/credentials';
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
  setRevealed: Dispatch<SetStateAction<Partial<Record<CredentialSecretField, string>>>>;
  loadDetail: () => Promise<void>;
  commitFormSnapshot: () => void;
  captureFormRollback: () => () => void;
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

  const runStepUp = useCallback(
    async (pwd: string) => {
      if (!state.credentialId || !state.stepUpField) return;
      try {
        if (state.stepUpMode === 'reveal') {
          const { value } = await credentialsApi.revealSecret(
            state.credentialId,
            state.stepUpField,
            pwd,
          );
          state.setRevealed((p) => ({ ...p, [state.stepUpField!]: value }));
        } else {
          const { value } = await credentialsApi.copySecret(
            state.credentialId,
            state.stepUpField,
            pwd,
          );
          await navigator.clipboard.writeText(value);
          toast.success('Copied');
        }
      } catch {
        toast.error('Step-up failed');
      }
    },
    [state],
  );

  return { saving, handleSave, runStepUp };
}
