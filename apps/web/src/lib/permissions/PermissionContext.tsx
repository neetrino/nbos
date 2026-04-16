'use client';

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
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
  const prevUserIdRef = useRef<string | undefined>();

  const accessToken = session?.accessToken ?? null;
  const userId = session?.user?.id;

  useEffect(() => {
    setAuthTokenGetter(async () => accessToken);
  }, [accessToken]);

  useEffect(() => {
    if (status === 'loading') return;

    if (status !== 'authenticated' || !userId) {
      setIsLoading(false);
      setMe(null);
      return;
    }

    if (prevUserIdRef.current === userId && me) return;
    prevUserIdRef.current = userId;

    let cancelled = false;
    setIsLoading(true);

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
  }, [userId, status]);

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
