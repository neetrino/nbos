'use client';

import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePermission } from '@/lib/permissions/PermissionContext';
import { listEmployeesForAppRail } from '@/lib/employees';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import { useMessengerZoneBootstrap } from '@/features/messenger/query/use-messenger-bootstrap';
import { useMessengerOverlay } from '@/features/messenger-internal/messenger-overlay-context';
import { openMessengerConversation } from '@/features/messenger-internal/messenger-conversation-opener';
import { findCachedDirectConversationId } from '@/features/messenger-internal/find-cached-direct-conversation';
import { useCachedPinnedDirectPeerIds } from '@/features/messenger-internal/use-cached-pinned-peers';
import {
  APP_MESSENGER_RIGHT_RAIL_WIDTH_PX,
  MessengerQuickRail,
} from '@/features/messenger-internal/MessengerQuickRail';

export { APP_MESSENGER_RIGHT_RAIL_WIDTH_PX };

const EMPLOYEES_RAIL_QUERY_KEY = ['app', 'employees-right-rail'] as const;

export function AppMessengerRightRail() {
  const queryClient = useQueryClient();
  const { me, can } = usePermission();
  const canView = can('VIEW', 'MESSENGER');
  const enabled = Boolean(canView && me);
  useMessengerZoneBootstrap('INTERNAL', enabled);
  const excludeIds = me?.id ? new Set([me.id]) : undefined;
  const employees = useQuery({
    queryKey: [...EMPLOYEES_RAIL_QUERY_KEY, me?.id ?? 'anon'],
    queryFn: () => listEmployeesForAppRail(excludeIds),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
  const pinnedPeerIds = useCachedPinnedDirectPeerIds();
  const { openMessenger } = useMessengerOverlay();
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

  if (!enabled) return null;

  const people = (employees.data ?? []).map((row) => ({
    id: row.value,
    label: row.label,
    avatarUrl: row.avatar?.trim() || undefined,
    pinned: pinnedPeerIds.has(row.value),
  }));

  return <MessengerQuickRail people={people} activeId={activeEmployeeId} onSelect={onSelect} />;
}
