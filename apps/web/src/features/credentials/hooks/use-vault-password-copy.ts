'use client';

import { useCallback } from 'react';
import { credentialNeedsVaultUnlock } from '@/features/credentials/constants/credential-vault-unlock';
import type { CredentialTileCopyTarget } from '@/features/credentials/hooks/use-credentials-vault-page';
import { useCredentialVaultSession } from '@/features/credentials/hooks/use-credential-vault-session';
import { isCredentialVaultStepUpRequired } from '@/features/credentials/utils/credential-step-up-error';
import { credentialsApi, type CredentialSecretField } from '@/lib/api/credentials';
import { toast } from 'sonner';

function copySuccessMessage(field: CredentialSecretField): string {
  if (field === 'apiKey') return 'API key copied';
  if (field === 'password') return 'Password copied';
  return 'Copied';
}

/** Copy a secret field from vault card; server session is source of truth for daily unlock. */
export function useVaultPasswordCopy(
  onNeedUnlock: (target: CredentialTileCopyTarget) => void,
  onCopied: (credentialId: string) => void,
) {
  const vault = useCredentialVaultSession();

  return useCallback(
    async (target: CredentialTileCopyTarget, stepUpPassword?: string) => {
      const field = target.field ?? 'password';
      const needsUnlock = credentialNeedsVaultUnlock(target.criticality);

      const runCopy = async (password?: string) => {
        const { value } = await credentialsApi.copySecret(target.id, field, password);
        await navigator.clipboard.writeText(value);
        toast.success(copySuccessMessage(field));
        if (needsUnlock) await vault.markUnlockedFromStepUp();
        onCopied(target.id);
      };

      if (!needsUnlock) {
        try {
          await runCopy();
        } catch {
          toast.error('Could not copy secret');
        }
        return;
      }

      if (stepUpPassword) {
        try {
          await runCopy(stepUpPassword);
        } catch {
          toast.error('Could not copy secret');
        }
        return;
      }

      try {
        await runCopy();
      } catch (error) {
        if (isCredentialVaultStepUpRequired(error)) {
          onNeedUnlock({ ...target, field });
          return;
        }
        toast.error('Could not copy secret');
      }
    },
    [onCopied, onNeedUnlock, vault],
  );
}
