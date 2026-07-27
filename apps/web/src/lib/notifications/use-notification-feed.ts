'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationsApi, type NotificationDto } from '@/lib/api/notifications';
import {
  connectNotificationSse,
  type NotificationSseStatus,
} from '@/lib/realtime/connect-notification-sse';
import {
  NOTIFICATION_FALLBACK_INTERVALS_MS,
  NOTIFICATION_FALLBACK_MAX_MS,
  NOTIFICATION_LIST_PAGE_SIZE,
  NOTIFICATION_SSE_FALLBACK_GRACE_MS,
} from '@/lib/realtime/notification-realtime.constants';
import { NotificationRefetchRegistry } from '@/lib/realtime/notification-refetch-registry';
import {
  createNotificationSseVersionGate,
  resetNotificationSseVersionOnOpen,
  shouldApplyNotificationSseVersion,
  type NotificationSseVersionGate,
} from '@/lib/realtime/notification-sse-version';

function withJitter(ms: number): number {
  const jitter = Math.floor(ms * 0.1 * Math.random());
  return ms + jitter;
}

/**
 * Application-shell notification feed: one SSE connection + optional fallback polling.
 * When SSE is connected, interval polling is disabled.
 * SSE versions are scoped to a connection generation (reset on every open/reconnect).
 */
export function useNotificationFeed(employeeId: string | undefined, listOpen: boolean) {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(false);
  const [sseStatus, setSseStatus] = useState<NotificationSseStatus>('disconnected');

  const registryRef = useRef(new NotificationRefetchRegistry());
  const listOpenRef = useRef(listOpen);
  listOpenRef.current = listOpen;
  const versionGateRef = useRef<NotificationSseVersionGate>(createNotificationSseVersionGate());
  const unreadAbortRef = useRef<AbortController | null>(null);
  const listAbortRef = useRef<AbortController | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackGraceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackStepRef = useRef(0);
  const sseConnectedRef = useRef(false);
  const pendingReconcileAfterVisibleRef = useRef(false);
  const documentHiddenRef = useRef(
    typeof document !== 'undefined' ? document.visibilityState === 'hidden' : false,
  );

  const clearFallbackTimers = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (fallbackGraceRef.current !== null) {
      clearTimeout(fallbackGraceRef.current);
      fallbackGraceRef.current = null;
    }
  }, []);

  const requestUnreadReconcile = useCallback((force = false) => {
    if (documentHiddenRef.current) {
      pendingReconcileAfterVisibleRef.current = true;
      return;
    }
    pendingReconcileAfterVisibleRef.current = false;
    registryRef.current.request(['notifications/unread'], force);
    if (listOpenRef.current) {
      registryRef.current.request(['notifications/list'], force);
    }
  }, []);

  const refreshUnread = useCallback(async () => {
    if (!employeeId) {
      setUnreadCount(0);
      return;
    }
    if (documentHiddenRef.current) {
      pendingReconcileAfterVisibleRef.current = true;
      return;
    }
    unreadAbortRef.current?.abort();
    const controller = new AbortController();
    unreadAbortRef.current = controller;
    try {
      const { count } = await notificationsApi.getUnreadCount();
      if (controller.signal.aborted) return;
      setUnreadCount(count);
      // Unread endpoint has no persistent version yet — do not seed lastVersion from GET.
    } catch {
      if (controller.signal.aborted) return;
      /* keep last known count — never force badge to 0 on error */
    }
  }, [employeeId]);

  const loadList = useCallback(
    async (mode: 'full' | 'silent') => {
      if (!employeeId || documentHiddenRef.current) {
        if (!employeeId) setItems([]);
        return;
      }
      if (!listOpenRef.current && mode === 'silent') {
        return;
      }
      listAbortRef.current?.abort();
      const controller = new AbortController();
      listAbortRef.current = controller;
      if (mode === 'full') {
        setListLoading(true);
        setListError(false);
      }
      try {
        const res = await notificationsApi.list({
          page: 1,
          pageSize: NOTIFICATION_LIST_PAGE_SIZE,
        });
        if (controller.signal.aborted) return;
        setItems(res.items);
      } catch {
        if (controller.signal.aborted) return;
        if (mode === 'full') {
          setListError(true);
          setItems([]);
        }
      } finally {
        if (mode === 'full' && !controller.signal.aborted) {
          setListLoading(false);
        }
      }
    },
    [employeeId],
  );

  const refreshList = useCallback(() => {
    void loadList('full');
  }, [loadList]);

  const applySsePayload = useCallback(
    (payload: { unreadCount: number; version: number }, invalidateList: boolean) => {
      const generation = versionGateRef.current.generation;
      const decided = shouldApplyNotificationSseVersion(
        versionGateRef.current,
        generation,
        payload.version,
      );
      versionGateRef.current = decided.next;
      if (!decided.apply) return;
      setUnreadCount(payload.unreadCount);
      if (invalidateList && listOpenRef.current) {
        registryRef.current.request(['notifications/list']);
      }
    },
    [],
  );

  const scheduleFallbackPolling = useCallback(() => {
    clearFallbackTimers();
    if (!employeeId || sseConnectedRef.current || documentHiddenRef.current) return;

    fallbackGraceRef.current = setTimeout(() => {
      fallbackGraceRef.current = null;
      if (sseConnectedRef.current || documentHiddenRef.current) return;

      const tick = () => {
        if (sseConnectedRef.current || documentHiddenRef.current || !employeeId) return;
        requestUnreadReconcile(true);
        const step = Math.min(
          fallbackStepRef.current,
          NOTIFICATION_FALLBACK_INTERVALS_MS.length - 1,
        );
        const base = NOTIFICATION_FALLBACK_INTERVALS_MS[step] ?? NOTIFICATION_FALLBACK_MAX_MS;
        fallbackStepRef.current = Math.min(
          fallbackStepRef.current + 1,
          NOTIFICATION_FALLBACK_INTERVALS_MS.length - 1,
        );
        fallbackTimerRef.current = setTimeout(tick, withJitter(base));
      };

      fallbackStepRef.current = 0;
      tick();
    }, NOTIFICATION_SSE_FALLBACK_GRACE_MS);
  }, [clearFallbackTimers, employeeId, requestUnreadReconcile]);

  useEffect(() => {
    const unsubUnread = registryRef.current.register('notifications/unread', () => refreshUnread());
    const unsubList = registryRef.current.register('notifications/list', () =>
      loadList(listOpenRef.current ? 'silent' : 'full'),
    );
    return () => {
      unsubUnread();
      unsubList();
    };
  }, [refreshUnread, loadList]);

  useEffect(() => {
    if (!employeeId) {
      setUnreadCount(0);
      setItems([]);
      clearFallbackTimers();
      versionGateRef.current = createNotificationSseVersionGate();
      return undefined;
    }

    requestUnreadReconcile(true);

    const session = connectNotificationSse({
      onStatus: (status) => {
        setSseStatus(status);
        sseConnectedRef.current = status === 'connected';
        if (status === 'connected') {
          clearFallbackTimers();
          fallbackStepRef.current = 0;
        } else if (status === 'disconnected') {
          scheduleFallbackPolling();
        }
      },
      onUnreadChanged: (payload) => {
        applySsePayload(payload, false);
      },
      onListInvalidate: (payload) => {
        applySsePayload(payload, true);
      },
      onOpen: () => {
        // Every open (first + reconnect): invalidate prior connection versions.
        versionGateRef.current = resetNotificationSseVersionOnOpen(versionGateRef.current);
        clearFallbackTimers();
        fallbackStepRef.current = 0;
        sseConnectedRef.current = true;
        // Single deduped reconcile — covers open + concurrent focus/visibility.
        requestUnreadReconcile(true);
      },
    });

    return () => {
      session.close();
      clearFallbackTimers();
      unreadAbortRef.current?.abort();
      listAbortRef.current?.abort();
      sseConnectedRef.current = false;
    };
  }, [
    employeeId,
    applySsePayload,
    clearFallbackTimers,
    scheduleFallbackPolling,
    requestUnreadReconcile,
  ]);

  useEffect(() => {
    if (!employeeId || !listOpen) return;
    requestUnreadReconcile(true);
  }, [employeeId, listOpen, requestUnreadReconcile]);

  useEffect(() => {
    if (!employeeId) return undefined;

    const onForeground = () => {
      documentHiddenRef.current = false;
      const hadPending = pendingReconcileAfterVisibleRef.current;
      pendingReconcileAfterVisibleRef.current = false;
      if (sseConnectedRef.current) {
        // Debounced unless we deferred reconcile while hidden (force then).
        requestUnreadReconcile(hadPending);
        return;
      }
      scheduleFallbackPolling();
      requestUnreadReconcile(hadPending);
    };

    const onVisibility = () => {
      const hidden = document.visibilityState === 'hidden';
      documentHiddenRef.current = hidden;
      if (hidden) {
        clearFallbackTimers();
        unreadAbortRef.current?.abort();
        listAbortRef.current?.abort();
        return;
      }
      onForeground();
    };

    window.addEventListener('focus', onForeground);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onForeground);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [employeeId, clearFallbackTimers, scheduleFallbackPolling, requestUnreadReconcile]);

  const markAllRead = useCallback(async () => {
    if (!employeeId) return;
    try {
      await notificationsApi.markAllAsRead();
      const readAt = new Date().toISOString();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt ?? readAt })));
      setUnreadCount(0);
    } catch {
      /* keep UI; user can retry */
    }
  }, [employeeId]);

  const applyLocalRead = useCallback((id: string) => {
    const readAt = new Date().toISOString();
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: n.readAt ?? readAt } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  return {
    items,
    unreadCount,
    listLoading,
    listError,
    sseStatus,
    refreshList,
    markAllRead,
    applyLocalRead,
  };
}
