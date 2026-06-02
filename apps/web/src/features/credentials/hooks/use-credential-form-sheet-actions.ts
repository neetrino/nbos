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
}

export function useCredentialFormSheetActions(
  props: CredentialFormSheetProps,
  state: CredentialFormSheetStateSlice,
) {
  const { onOpenChange, projectId, productId, successToast, onCreated, onSaved } = props;
  const { creatorId } = useTaskCreatorId();
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!state.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: state.name.trim(),
        category: state.category,
        credentialType: state.credentialType,
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
        manualGrants:
          state.isCreate && state.manualGrants.length > 0
            ? state.manualGrants.map((g) => ({
                employeeId: g.employeeId,
                level: g.level,
                expiresAt: g.expiresAt,
              }))
            : undefined,
      };
      if (state.isCreate) {
        if (projectId) body.projectId = projectId;
        if (productId) body.productId = productId;
        if (state.accessLevel === 'PERSONAL' && creatorId) body.ownerId = creatorId;
        const created = await credentialsApi.create(body);
        if (successToast !== false) toast.success(successToast ?? CREATE_DEFAULT_SUCCESS_TOAST);
        onOpenChange(false);
        onCreated?.(created);
        onSaved?.();
      } else if (state.credentialId) {
        body.criticality = state.criticality;
        body.nextRotationAt = state.nextRotationAt || null;
        await credentialsApi.update(state.credentialId, body);
        await credentialsApi.replaceManualAccess(
          state.credentialId,
          state.manualGrants.map((g) => ({
            employeeId: g.employeeId,
            level: g.level,
            expiresAt: g.expiresAt,
          })),
        );
        toast.success('Credential saved');
        await state.loadDetail();
        onSaved?.();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }, [creatorId, onCreated, onOpenChange, onSaved, productId, projectId, state, successToast]);

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
