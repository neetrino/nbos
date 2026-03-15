'use client';

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
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
  const { isSignedIn, getToken } = useAuth();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRegistered = useRef(false);

  useEffect(() => {
    if (!tokenRegistered.current && getToken) {
      setAuthTokenGetter(getToken);
      tokenRegistered.current = true;
    }
  }, [getToken]);

  useEffect(() => {
    if (!isSignedIn) {
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
        /* noop — user might not have employee record yet */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchMe();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

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
