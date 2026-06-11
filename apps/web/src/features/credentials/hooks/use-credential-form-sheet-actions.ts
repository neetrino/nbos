'use client';

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { entriesFromEnvBundleSerialized, serializeEnvBundle } from '@nbos/shared';
import {
  credentialsApi,
  type CredentialDetail,
  type CredentialSecretField,
} from '@/lib/api/credentials';
import { downloadEnvBundleFile } from '@/features/credentials/utils/download-env-bundle-file';
import { credentialNeedsVaultUnlock } from '@/features/credentials/constants/credential-vault-unlock';
import { isCredentialVaultStepUpRequired } from '@/features/credentials/utils/credential-step-up-error';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { toast } from 'sonner';
import type { CredentialFormSheetProps } from '@/features/credentials/components/credential-form-sheet-types';
import { showsProviderPicker } from '@/features/credentials/credential-field-config';
import { normalizeCredentialPhones } from '@/features/credentials/utils/credential-phones-normalize';
import type { AppStorePlatform } from '@/features/credentials/constants/credential-app-store-platform';

const CREATE_DEFAULT_SUCCESS_TOAST = 'Credential created';

export interface CredentialFormSheetStateSlice {
  isCreate: boolean;
  credentialId: string | null;
  name: string;
  category: string;
  credentialType: string;
  criticality: string;
  providerId: string | null;
  url: string;
  login: string;
  phones: string[];
  appStorePlatform: AppStorePlatform;
  password: string;
  passphrase: string;
  apiKey: string;
  envData: string;
  setEnvData: Dispatch<SetStateAction<string>>;
  setEnvSnap: Dispatch<SetStateAction<string>>;
  comment: string;
  accessLevel: string;
  nextRotationAt: string;
  manualGrants: { employeeId: string; level: 'VIEW' | 'EDIT'; expiresAt: string | null }[];
  folderId: string | null;
  stepUpField: CredentialSecretField | null;
  stepUpMode: 'reveal' | 'copy';
  setStepUpField: Dispatch<SetStateAction<CredentialSecretField | null>>;
  setStepUpMode: Dispatch<SetStateAction<'reveal' | 'copy'>>;
  setRevealed: Dispatch<SetStateAction<Partial<Record<CredentialSecretField, string>>>>;
  loadDetail: () => Promise<void>;
  promoteAfterCreate: (created: CredentialDetail) => void;
  commitFormSnapshot: () => void;
  captureFormRollback: () => () => void;
  orphanedSecretsAcknowledged: boolean;
  detailCredentialType: string | null;
  clearOrphanedSecretsAcknowledged: () => void;
}

import type { CredentialVaultSessionValue } from '@/features/credentials/hooks/use-credential-vault-session';

function buildCredentialUpdateBody(state: CredentialFormSheetStateSlice): Record<string, unknown> {
  return {
    name: state.name.trim(),
    category: state.category,
    credentialType: state.credentialType,
    criticality: state.criticality,
    providerId: showsProviderPicker(state.credentialType) ? state.providerId : null,
    url: state.url.trim() || undefined,
    login: state.login.trim() || undefined,
    phones: (() => {
      const list = normalizeCredentialPhones(state.phones);
      return list.length > 0 ? list : undefined;
    })(),
    phone: normalizeCredentialPhones(state.phones)[0] || undefined,
    password: state.password.trim() || undefined,
    passphrase: state.passphrase.trim() || undefined,
    appStorePlatform:
      state.credentialType === 'APP_STORE_ACCOUNT' ? state.appStorePlatform : undefined,
    apiKey: state.apiKey.trim() || undefined,
    envData: state.envData.trim() || undefined,
    /** `null` clears comment; `undefined` would skip the field on PATCH. */
    secureNotes: state.comment.trim() === '' ? null : state.comment.trim(),
    accessLevel: state.accessLevel,
    nextRotationAt: state.nextRotationAt || null,
    folderId: state.folderId,
    acknowledgeOrphanedSecrets:
      state.orphanedSecretsAcknowledged &&
      state.detailCredentialType !== null &&
      state.credentialType !== state.detailCredentialType
        ? true
        : undefined,
  };
}

export function useCredentialFormSheetActions(
  props: CredentialFormSheetProps,
  state: CredentialFormSheetStateSlice,
  vault: CredentialVaultSessionValue,
) {
  const {
    onOpenChange,
    projectId,
    productId,
    initialFolderId,
    successToast,
    continueAfterCreate = false,
    onCreated,
    onSaved,
  } = props;
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
        state.clearOrphanedSecretsAcknowledged();
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
        if (initialFolderId !== undefined) body.folderId = initialFolderId;
        if (state.accessLevel === 'PERSONAL' && creatorId) body.ownerId = creatorId;
        const created = await credentialsApi.create(body);
        if (successToast !== false) toast.success(successToast ?? CREATE_DEFAULT_SUCCESS_TOAST);
        onCreated?.(created);
        if (continueAfterCreate) {
          state.promoteAfterCreate(created);
        } else {
          onOpenChange(false);
        }
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
    continueAfterCreate,
    creatorId,
    onCreated,
    onOpenChange,
    onSaved,
    productId,
    projectId,
    initialFolderId,
    saveEditInBackground,
    state,
    successToast,
  ]);

  const accessSecretPlaintext = useCallback(
    async (field: CredentialSecretField, pwd?: string): Promise<string | null> => {
      if (!state.credentialId) return null;
      const needsUnlock = credentialNeedsVaultUnlock(state.criticality);

      const run = async (stepUpPassword?: string) => {
        const { value } = await credentialsApi.revealSecret(
          state.credentialId!,
          field,
          stepUpPassword,
        );
        if (needsUnlock) await vault.markUnlockedFromStepUp();
        return value;
      };

      try {
        if (pwd) return await run(pwd);
        if (!needsUnlock) return await run();
        try {
          return await run();
        } catch (error) {
          if (isCredentialVaultStepUpRequired(error)) {
            state.setStepUpField(field);
            state.setStepUpMode('copy');
            return null;
          }
          throw error;
        }
      } catch {
        toast.error('Could not access secret');
        return null;
      }
    },
    [state, vault],
  );

  const executeSecretAction = useCallback(
    async (
      field: CredentialSecretField,
      mode: 'reveal' | 'copy',
      pwd?: string,
    ): Promise<boolean> => {
      const plaintext =
        mode === 'copy'
          ? await (async () => {
              if (!state.credentialId) return null;
              const needsUnlock = credentialNeedsVaultUnlock(state.criticality);
              const run = async (stepUpPassword?: string) => {
                const { value } = await credentialsApi.copySecret(
                  state.credentialId!,
                  field,
                  stepUpPassword,
                );
                if (needsUnlock) await vault.markUnlockedFromStepUp();
                return value;
              };
              try {
                if (pwd) return await run(pwd);
                if (!needsUnlock) return await run();
                try {
                  return await run();
                } catch (error) {
                  if (isCredentialVaultStepUpRequired(error)) {
                    state.setStepUpField(field);
                    state.setStepUpMode('copy');
                    return null;
                  }
                  throw error;
                }
              } catch {
                toast.error('Could not access secret');
                return null;
              }
            })()
          : await accessSecretPlaintext(field, pwd);

      if (!plaintext) return false;

      if (mode === 'reveal') {
        state.setRevealed((p) => ({ ...p, [field]: plaintext }));
        return true;
      }

      await navigator.clipboard.writeText(plaintext);
      toast.success('Copied');
      return true;
    },
    [accessSecretPlaintext, state, vault],
  );

  const hydrateEnvBundleKeyPreview = useCallback(async (): Promise<boolean> => {
    const value = await accessSecretPlaintext('envData');
    if (!value) return false;
    const entries = entriesFromEnvBundleSerialized(value);
    if (entries.length === 0) return false;
    const keyPreview = serializeEnvBundle(entries.map((entry) => ({ key: entry.key, value: '' })));
    state.setEnvData(keyPreview);
    state.setEnvSnap(keyPreview);
    return true;
  }, [accessSecretPlaintext, state]);

  const downloadEnvBundle = useCallback(async (): Promise<string | null> => {
    const value = await accessSecretPlaintext('envData');
    if (!value?.trim()) return null;
    const entries = entriesFromEnvBundleSerialized(value);
    if (entries.length === 0) return null;
    downloadEnvBundleFile(entries);
    toast.success('Downloaded .env');
    return value;
  }, [accessSecretPlaintext]);

  const requestSecretAction = useCallback(
    (field: CredentialSecretField, mode: 'reveal' | 'copy') => {
      void executeSecretAction(field, mode);
    },
    [executeSecretAction],
  );

  const runStepUp = useCallback(
    async (pwd: string) => {
      if (!state.stepUpField) return;
      await executeSecretAction(state.stepUpField, state.stepUpMode, pwd);
      state.setStepUpField(null);
    },
    [executeSecretAction, state],
  );

  const copySecretField = useCallback(
    (field: CredentialSecretField) => executeSecretAction(field, 'copy'),
    [executeSecretAction],
  );

  return {
    saving,
    handleSave,
    runStepUp,
    requestSecretAction,
    copySecretField,
    hydrateEnvBundleKeyPreview,
    downloadEnvBundle,
  };
}
