'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { MeResponse, PermissionMap, PermissionScope } from './types';
import { api, setAuthTokenGetter } from '@/lib/api';

interface PermissionContextValue {
  me: MeResponse | null;
  permissions: PermissionMap;
  isLoading: boolean;
  can: (action: string, module: string) => boolean;
  scope: (action: string, module: string) => PermissionScope | null;
}

const PermissionCtx = createContext<PermissionContextValue>({
  me: null,
  permissions: {},
  isLoading: true,
  can: () => false,
  scope: () => null,
});

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync before child useEffects run: nested passive effects run inner-to-outer,
  // so axios must already have the token getter when pages like /dashboard fetch.
  const accessToken = session?.accessToken ?? null;
  setAuthTokenGetter(async () => accessToken);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchMe() {
      try {
        const res = await api.get<MeResponse>('/api/me');
        if (!cancelled) {
          setMe(res.data);
        }
      } catch {
        /* noop */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchMe();
    return () => {
      cancelled = true;
    };
  }, [session, status]);

  const permissions = me?.permissions ?? {};

  function can(action: string, module: string): boolean {
    const key = `${module}_${action}`;
    const s = permissions[key];
    return !!s && s !== 'NONE';
  }

  function scope(action: string, module: string): PermissionScope | null {
    const key = `${module}_${action}`;
    return (permissions[key] as PermissionScope) ?? null;
  }

  return (
    <PermissionCtx.Provider value={{ me, permissions, isLoading, can, scope }}>
      {children}
    </PermissionCtx.Provider>
  );
}

export function usePermission() {
  return useContext(PermissionCtx);
}
