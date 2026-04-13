'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
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

function SessionGate({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const accessToken = session?.accessToken ?? null;
  setAuthTokenGetter(async () => accessToken);

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return null;
  }

  return <>{children}</>;
}

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading' || !session) {
      if (status !== 'loading') setIsLoading(false);
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
      <SessionGate>{children}</SessionGate>
    </PermissionCtx.Provider>
  );
}

export function usePermission() {
  return useContext(PermissionCtx);
}
