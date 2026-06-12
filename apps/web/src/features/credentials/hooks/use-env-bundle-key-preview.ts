'use client';

import { useEffect, useRef } from 'react';
import { credentialNeedsVaultUnlock } from '@/features/credentials/constants/credential-vault-unlock';

interface UseEnvBundleKeyPreviewParams {
  open: boolean;
  detailHydrated: boolean;
  credentialId: string | null;
  credentialType: string;
  criticality: string;
  envData: string;
  hasStoredBundle: boolean;
  revealedEnv: string | undefined;
  hydrateKeys: () => Promise<boolean>;
}

/** Loads ENV keys into the form (empty values) for masked table — no UI reveal. */
export function useEnvBundleKeyPreview({
  open,
  detailHydrated,
  credentialId,
  credentialType,
  criticality,
  envData,
  hasStoredBundle,
  revealedEnv,
  hydrateKeys,
}: UseEnvBundleKeyPreviewParams) {
  const hydratedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      hydratedForRef.current = null;
      return;
    }
    if (!detailHydrated || !credentialId) return;
    if (credentialType !== 'ENV_BUNDLE') return;
    if (!hasStoredBundle) return;
    if (revealedEnv) return;
    if (envData.trim().length > 0) return;
    if (credentialNeedsVaultUnlock(criticality)) return;
    if (hydratedForRef.current === credentialId) return;

    hydratedForRef.current = credentialId;
    void hydrateKeys();
  }, [
    open,
    criticality,
    credentialId,
    credentialType,
    detailHydrated,
    envData,
    hasStoredBundle,
    hydrateKeys,
    revealedEnv,
  ]);
}
