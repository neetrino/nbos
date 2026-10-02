'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const MessengerPresenceContext = createContext<ReadonlySet<string>>(new Set());

const PRESENCE_ONLINE_CLASS = 'bg-[#10b981]';
const PRESENCE_OFFLINE_CLASS = 'bg-[#94a3b8]';

export function MessengerPresenceProvider({
  onlineIds,
  children,
}: {
  onlineIds: ReadonlySet<string>;
  children: ReactNode;
}) {
  return (
    <MessengerPresenceContext.Provider value={onlineIds}>
      {children}
    </MessengerPresenceContext.Provider>
  );
}

export function useEmployeeOnline(employeeId: string | null | undefined): boolean {
  const onlineIds = useContext(MessengerPresenceContext);
  if (!employeeId) return false;
  return onlineIds.has(employeeId);
}

export function PresenceDot({ online, size = 'md' }: { online: boolean; size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute -right-0.5 -bottom-0.5 rounded-full border-2 border-white',
        size === 'sm' ? 'size-2.5' : 'size-3',
        online ? PRESENCE_ONLINE_CLASS : PRESENCE_OFFLINE_CLASS,
      )}
    />
  );
}
