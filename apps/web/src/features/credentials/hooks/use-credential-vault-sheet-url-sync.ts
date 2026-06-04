'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { CREDENTIAL_VAULT_OPEN_QUERY } from '@/features/credentials/constants/credential-vault-deep-link';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { credentialsApi } from '@/lib/api/credentials';

export interface UseCredentialVaultSheetUrlSyncParams {
  credentials: CredentialListItem[];
  loading: boolean;
  setSheetCredentialId: (id: string | null) => void;
  setSheetOpen: (open: boolean) => void;
}

/**
 * Keeps vault sheet state in sync with `?openCredentialId=` (CRM / Finance list pattern).
 */
export function useCredentialVaultSheetUrlSync({
  credentials,
  loading,
  setSheetCredentialId,
  setSheetOpen,
}: UseCredentialVaultSheetUrlSyncParams) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const deepLinkAttemptedRef = useRef<string | null>(null);

  const openCredentialIdFromUrl = searchParams.get(CREDENTIAL_VAULT_OPEN_QUERY)?.trim() || null;

  const stripOpenCredentialFromUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has(CREDENTIAL_VAULT_OPEN_QUERY)) return;
    params.delete(CREDENTIAL_VAULT_OPEN_QUERY);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const pushOpenCredentialToUrl = useCallback(
    (credentialId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(CREDENTIAL_VAULT_OPEN_QUERY, credentialId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    deepLinkAttemptedRef.current = null;
  }, [openCredentialIdFromUrl]);

  // React only to URL / list changes — not `sheetOpen` (CRM leads pattern). Otherwise closing
  // the sheet re-triggers this effect while `openCredentialId` is still in the address bar.
  useEffect(() => {
    if (!openCredentialIdFromUrl || loading) return;

    const fromList = credentials.find((row) => row.id === openCredentialIdFromUrl);
    if (fromList) {
      setSheetCredentialId(openCredentialIdFromUrl);
      setSheetOpen(true);
      return;
    }

    if (deepLinkAttemptedRef.current === openCredentialIdFromUrl) return;
    deepLinkAttemptedRef.current = openCredentialIdFromUrl;

    let cancelled = false;
    void (async () => {
      try {
        await credentialsApi.getById(openCredentialIdFromUrl);
        if (cancelled) return;
        setSheetCredentialId(openCredentialIdFromUrl);
        setSheetOpen(true);
      } catch {
        if (!cancelled) {
          toast.error('Credential not found or you cannot open it.');
          stripOpenCredentialFromUrl();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    credentials,
    loading,
    openCredentialIdFromUrl,
    setSheetCredentialId,
    setSheetOpen,
    stripOpenCredentialFromUrl,
  ]);

  return { pushOpenCredentialToUrl, stripOpenCredentialFromUrl };
}
