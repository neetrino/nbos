'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CREDENTIAL_VAULT_OPEN_QUERY } from '@/features/credentials/constants/credential-vault-deep-link';

export function useCredentialVaultOpenQuery(onOpenCredential: (id: string) => void) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const openId = searchParams.get(CREDENTIAL_VAULT_OPEN_QUERY)?.trim();
    if (!openId) {
      handledRef.current = null;
      return;
    }
    if (handledRef.current === openId) return;
    handledRef.current = openId;
    onOpenCredential(openId);
    const next = new URLSearchParams(searchParams.toString());
    next.delete(CREDENTIAL_VAULT_OPEN_QUERY);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [searchParams, pathname, router, onOpenCredential]);
}
