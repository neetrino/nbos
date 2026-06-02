'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { credentialsApi } from '@/lib/api/credentials';

export interface CredentialVaultSessionValue {
  unlocked: boolean;
  expiresAt: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  unlock: (password: string) => Promise<{ unlocked: boolean; expiresAt: string | null }>;
  lock: () => Promise<void>;
  /** After a successful step-up copy/reveal, mark session unlocked locally and refresh from API. */
  markUnlockedFromStepUp: () => Promise<void>;
}

export const CredentialVaultSessionContext = createContext<CredentialVaultSessionValue | null>(
  null,
);

export function CredentialVaultSessionProvider({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const session = await credentialsApi.getVaultSession();
      setUnlocked(session.unlocked);
      setExpiresAt(session.expiresAt);
    } catch {
      setUnlocked(false);
      setExpiresAt(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const unlock = useCallback(async (password: string) => {
    const session = await credentialsApi.unlockVault(password);
    setUnlocked(session.unlocked);
    setExpiresAt(session.expiresAt);
    setLoading(false);
    return session;
  }, []);

  const lock = useCallback(async () => {
    await credentialsApi.lockVault();
    setUnlocked(false);
    setExpiresAt(null);
    setLoading(false);
  }, []);

  const markUnlockedFromStepUp = useCallback(async () => {
    setUnlocked(true);
    await refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      unlocked,
      expiresAt,
      loading,
      refresh,
      unlock,
      lock,
      markUnlockedFromStepUp,
    }),
    [unlocked, expiresAt, loading, refresh, unlock, lock, markUnlockedFromStepUp],
  );

  return (
    <CredentialVaultSessionContext.Provider value={value}>
      {children}
    </CredentialVaultSessionContext.Provider>
  );
}

export function useCredentialVaultSession(): CredentialVaultSessionValue {
  const ctx = useContext(CredentialVaultSessionContext);
  if (!ctx) {
    throw new Error('useCredentialVaultSession must be used within CredentialVaultSessionProvider');
  }
  return ctx;
}

/** Returns null when rendered outside {@link CredentialVaultSessionProvider}. */
export function useCredentialVaultSessionContext(): CredentialVaultSessionValue | null {
  return useContext(CredentialVaultSessionContext);
}
