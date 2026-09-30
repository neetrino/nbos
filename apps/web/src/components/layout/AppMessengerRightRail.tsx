'use client';

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePermission } from '@/lib/permissions/PermissionContext';
import { listEmployeesForAppRail } from '@/lib/employees';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import { useMessengerOverlay } from '@/features/messenger-internal/messenger-overlay-context';
import { openMessengerConversation } from '@/features/messenger-internal/messenger-conversation-opener';
import {
  APP_MESSENGER_RIGHT_RAIL_WIDTH_PX,
  MessengerQuickRail,
} from '@/features/messenger-internal/MessengerQuickRail';

export { APP_MESSENGER_RIGHT_RAIL_WIDTH_PX };

const EMPLOYEES_RAIL_QUERY_KEY = ['app', 'employees-right-rail'] as const;

export function AppMessengerRightRail() {
  const { me, can } = usePermission();
  const canView = can('VIEW', 'MESSENGER');
  const enabled = Boolean(canView && me);
  const excludeIds = me?.id ? new Set([me.id]) : undefined;
  const employees = useQuery({
    queryKey: [...EMPLOYEES_RAIL_QUERY_KEY, me?.id ?? 'anon'],
    queryFn: () => listEmployeesForAppRail(excludeIds),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
  const { openMessenger } = useMessengerOverlay();
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  const onSelect = useCallback(
    async (employeeId: string) => {
      if (opening) return;
      setOpening(true);
      setActiveEmployeeId(employeeId);
      try {
        const conversation = await messengerCoreApi.createConversation({
          type: 'DIRECT',
          peerEmployeeId: employeeId,
        });
        openMessengerConversation(conversation.id, (id) => {
          openMessenger('direct', id);
        });
      } catch {
        setActiveEmployeeId(null);
      } finally {
        setOpening(false);
      }
    },
    [openMessenger, opening],
  );

  if (!enabled) return null;

  const people = (employees.data ?? []).map((row) => ({
    id: row.value,
    label: row.label,
    avatarUrl: row.avatar?.trim() || undefined,
  }));

  return (
    <MessengerQuickRail
      people={people}
      activeId={activeEmployeeId}
      onSelect={(employeeId) => {
        void onSelect(employeeId);
      }}
    />
  );
}
