'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CREDENTIAL_VAULT_COPY_FEEDBACK_MS } from '@/features/credentials/constants/credential-vault-copy';

/** Brief emerald highlight after a successful vault copy (cards + sheet fields). */
export function useCredentialVaultCopyFeedback() {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const markCopied = useCallback(() => {
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), CREDENTIAL_VAULT_COPY_FEEDBACK_MS);
  }, []);

  return { copied, markCopied };
}
