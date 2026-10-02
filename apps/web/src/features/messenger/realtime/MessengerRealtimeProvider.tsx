'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { recoverRealtimeSession } from '@/lib/auth/realtime-session';
import { usePermission } from '@/lib/permissions/PermissionContext';
import { recoverMessengerZone } from '@/features/messenger/query/messenger-delta-recovery';
import { MessengerRealtimeHub } from './messenger-realtime-hub';
import { connectMessengerSocket } from './messenger-socket-client';

const MessengerRealtimeContext = createContext<MessengerRealtimeHub | null>(null);

export function MessengerRealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { me, can } = usePermission();
  const hub = useStableMessengerHub();
  hub.attachQueryClient(queryClient);
  useMessengerSocketLifecycle(hub, can('VIEW', 'MESSENGER'), me?.id);
  return (
    <MessengerRealtimeContext.Provider value={hub}>{children}</MessengerRealtimeContext.Provider>
  );
}

export function useMessengerRealtimeHub(): MessengerRealtimeHub {
  const hub = useContext(MessengerRealtimeContext);
  if (!hub) throw new Error('Messenger realtime runtime is not mounted');
  return hub;
}

function useStableMessengerHub(): MessengerRealtimeHub {
  const [hub] = useState(
    () =>
      new MessengerRealtimeHub({
        connect: connectMessengerSocket,
        recoverSession: recoverRealtimeSession,
        recoverZone: recoverMessengerZone,
      }),
  );
  return hub;
}

function useMessengerSocketLifecycle(
  hub: MessengerRealtimeHub,
  canViewMessenger: boolean,
  meId: string | undefined,
): void {
  useEffect(() => {
    if (!canViewMessenger || !meId) {
      hub.stop();
      return;
    }
    let cancelled = false;
    void recoverRealtimeSession().then((result) => {
      if (cancelled) return;
      if (result.kind !== 'available') {
        hub.stop();
        return;
      }
      hub.start(result.accessToken);
    });
    return () => {
      cancelled = true;
      hub.stop();
    };
  }, [hub, canViewMessenger, meId]);
}
