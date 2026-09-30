'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePermission } from '@/lib/permissions/PermissionContext';
import { listEmployeesForAppRail } from '@/lib/employees';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import { useMessengerZoneBootstrap } from '@/features/messenger/query/use-messenger-bootstrap';
import { useMessengerOverlay } from '@/features/messenger-internal/messenger-overlay-context';
import { useClientMessengerOverlay } from '@/features/messenger-client/client-messenger-overlay-context';
import { openMessengerConversation } from '@/features/messenger-internal/messenger-conversation-opener';
import { findCachedDirectConversationId } from '@/features/messenger-internal/find-cached-direct-conversation';
import { useCachedDirectRailPeerState } from '@/features/messenger-internal/use-cached-pinned-peers';
import {
  APP_MESSENGER_RIGHT_RAIL_WIDTH_PX,
  MessengerQuickRail,
  type MessengerQuickRailShortcut,
} from '@/features/messenger-internal/MessengerQuickRail';

export { APP_MESSENGER_RIGHT_RAIL_WIDTH_PX };

const EMPLOYEES_RAIL_QUERY_KEY = ['app', 'employees-right-rail'] as const;

export function AppMessengerRightRail() {
  const queryClient = useQueryClient();
  const { me, can } = usePermission();
  const canView = can('VIEW', 'MESSENGER');
  const enabled = Boolean(canView && me);
  useMessengerZoneBootstrap('INTERNAL', enabled);
  useMessengerZoneBootstrap('CLIENT', enabled);
  const excludeIds = me?.id ? new Set([me.id]) : undefined;
  const employees = useQuery({
    queryKey: [...EMPLOYEES_RAIL_QUERY_KEY, me?.id ?? 'anon'],
    queryFn: () => listEmployeesForAppRail(excludeIds),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
  const { pinnedIds, unreadByPeerId, internalUnreadTotal, clientUnreadTotal } =
    useCachedDirectRailPeerState(enabled);
  const { openMessenger } = useMessengerOverlay();
  const { openClientMessenger } = useClientMessengerOverlay();
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);

  const onSelect = useCallback(
    (employeeId: string) => {
      setActiveEmployeeId(employeeId);
      const cachedId = findCachedDirectConversationId(queryClient, employeeId);
      if (cachedId) {
        openMessengerConversation(cachedId, (id) => openMessenger('direct', id));
        return;
      }
      openMessenger('direct');
      void messengerCoreApi
        .createConversation({ type: 'DIRECT', peerEmployeeId: employeeId })
        .then((conversation) => {
          openMessengerConversation(conversation.id, (id) => openMessenger('direct', id));
        })
        .catch(() => setActiveEmployeeId(null));
    },
    [openMessenger, queryClient],
  );

  const shortcuts = useMemo<MessengerQuickRailShortcut[]>(
    () => [
      {
        id: 'messenger',
        label: 'Messenger',
        unreadCount: internalUnreadTotal,
        onSelect: () => openMessenger('all'),
      },
      {
        id: 'client-messenger',
        label: 'Client Messenger',
        unreadCount: clientUnreadTotal,
        onSelect: () => openClientMessenger('inbox'),
      },
    ],
    [clientUnreadTotal, internalUnreadTotal, openClientMessenger, openMessenger],
  );

  if (!enabled) return null;

  const people = (employees.data ?? []).map((row) => ({
    id: row.value,
    label: row.label,
    avatarUrl: row.avatar?.trim() || undefined,
    pinned: pinnedIds.has(row.value),
    unreadCount: unreadByPeerId.get(row.value) ?? 0,
  }));

  return (
    <MessengerQuickRail
      people={people}
      shortcuts={shortcuts}
      activeId={activeEmployeeId}
      onSelect={onSelect}
    />
  );
}
