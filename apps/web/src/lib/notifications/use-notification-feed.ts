'use client';

import { useCallback, useEffect, useState } from 'react';
import { notificationsApi, type NotificationDto } from '@/lib/api/notifications';

const NOTIFICATION_UNREAD_POLL_MS = 30_000;
const NOTIFICATION_LIST_PAGE_SIZE = 20;

export function useNotificationFeed(employeeId: string | undefined, listOpen: boolean) {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(false);

  const refreshUnread = useCallback(async () => {
    if (!employeeId) {
      setUnreadCount(0);
      return;
    }
    try {
      const { count } = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, [employeeId]);

  const refreshList = useCallback(async () => {
    if (!employeeId) {
      setItems([]);
      return;
    }
    setListLoading(true);
    setListError(false);
    try {
      const res = await notificationsApi.list(1, NOTIFICATION_LIST_PAGE_SIZE);
      setItems(res.items);
    } catch {
      setListError(true);
      setItems([]);
    } finally {
      setListLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId) return undefined;
    void refreshUnread();
    const t = window.setInterval(() => {
      void refreshUnread();
    }, NOTIFICATION_UNREAD_POLL_MS);
    return () => window.clearInterval(t);
  }, [employeeId, refreshUnread]);

  useEffect(() => {
    if (!employeeId || !listOpen) return;
    void refreshList();
    void refreshUnread();
  }, [employeeId, listOpen, refreshList, refreshUnread]);

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
    refreshList,
    markAllRead,
    applyLocalRead,
  };
}
