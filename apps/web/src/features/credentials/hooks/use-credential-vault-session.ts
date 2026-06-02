'use client';

import { useCallback, useEffect, useState } from 'react';
import { credentialsApi } from '@/lib/api/credentials';

export interface CredentialVaultSessionState {
  unlocked: boolean;
  expiresAt: string | null;
  loading: boolean;
}

export function useCredentialVaultSession(enabled = true) {
  const [state, setState] = useState<CredentialVaultSessionState>({
    unlocked: false,
    expiresAt: null,
    loading: enabled,
  });

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const session = await credentialsApi.getVaultSession();
      setState({ unlocked: session.unlocked, expiresAt: session.expiresAt, loading: false });
    } catch {
      setState({ unlocked: false, expiresAt: null, loading: false });
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const unlock = useCallback(async (password: string) => {
    const session = await credentialsApi.unlockVault(password);
    setState({ unlocked: session.unlocked, expiresAt: session.expiresAt, loading: false });
    return session;
  }, []);

  const lock = useCallback(async () => {
    await credentialsApi.lockVault();
    setState({ unlocked: false, expiresAt: null, loading: false });
  }, []);

  return { ...state, refresh, unlock, lock };
}
