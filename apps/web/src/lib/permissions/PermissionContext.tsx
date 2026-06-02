'use client';

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import type { MeResponse, PermissionMap, PermissionScope } from './types';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';

const PERMISSIONS_LOAD_ERROR_TOAST_ID = 'nbos-permissions-load-error';
const PERMISSIONS_ERROR_TOAST_MS = 8_000;

interface PermissionContextValue {
  me: MeResponse | null;
  permissions: PermissionMap;
  isLoading: boolean;
  /** Set when `/api/me` fails after sign-in; empty permissions alone are ambiguous. */
  meLoadError: string | null;
  can: (action: string, module: string) => boolean;
  scope: (action: string, module: string) => PermissionScope | null;
}

const PermissionCtx = createContext<PermissionContextValue>({
  me: null,
  permissions: {},
  isLoading: true,
  meLoadError: null,
  can: () => false,
  scope: () => null,
});

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [meLoadError, setMeLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  /** One `/api/me` fetch per signed-in user; avoids refetch loops when `me` stays null. */
  const fetchedUserIdRef = useRef<string | null>(null);

  const userId = session?.user?.id;

  useEffect(() => {
    if (status === 'loading') return;

    if (status !== 'authenticated' || !userId) {
      fetchedUserIdRef.current = null;
      setIsLoading(false);
      setMe(null);
      setMeLoadError(null);
      return;
    }

    if (fetchedUserIdRef.current === userId) return;
    fetchedUserIdRef.current = userId;

    let cancelled = false;
    setIsLoading(true);

    async function fetchMe() {
      try {
        const res = await api.get<MeResponse>('/api/me');
        if (!cancelled) {
          setMe(res.data);
          setMeLoadError(null);
          toast.dismiss(PERMISSIONS_LOAD_ERROR_TOAST_ID);
        }
      } catch (caught: unknown) {
        if (!cancelled) {
          const message = getApiErrorMessage(
            caught,
            'Unable to load your permissions. Check your connection or sign in again.',
          );
          setMe(null);
          setMeLoadError(message);
          toast.error(message, {
            id: PERMISSIONS_LOAD_ERROR_TOAST_ID,
            duration: PERMISSIONS_ERROR_TOAST_MS,
          });
        }
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
    <PermissionCtx.Provider value={{ me, permissions, isLoading, meLoadError, can, scope }}>
      {children}
    </PermissionCtx.Provider>
  );
}

export function usePermission() {
  return useContext(PermissionCtx);
}
