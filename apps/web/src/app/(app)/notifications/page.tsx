'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Archive, Bell, CheckCheck, RefreshCw } from 'lucide-react';
import type { NotificationDto } from '@/lib/api/notifications';
import { notificationsApi } from '@/lib/api/notifications';
import { getNotificationVisual } from '@/lib/notifications/notification-type-visual';

const PAGE_SIZE = 30;

const CATEGORY_FILTERS = [
  { value: undefined, label: 'All' },
  { value: 'informational', label: 'Info' },
  { value: 'action_required', label: 'Action required' },
  { value: 'system_health', label: 'System health' },
  { value: 'audit_security', label: 'Security' },
] as const;

type CategoryFilter = (typeof CATEGORY_FILTERS)[number]['value'];

function formatDate(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function categoryLabel(category: string): string {
  const known = CATEGORY_FILTERS.find((item) => item.value === category);
  return known?.label ?? category.replaceAll('_', ' ');
}

function priorityClass(priority: string): string {
  if (priority === 'critical') return 'border-red-500/40 bg-red-500/10 text-red-700';
  if (priority === 'high') return 'border-amber-500/40 bg-amber-500/10 text-amber-700';
  return 'border-border bg-secondary text-muted-foreground';
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [category, setCategory] = useState<CategoryFilter>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await notificationsApi.list({ page: 1, pageSize: PAGE_SIZE, category });
      setItems(result.items);
    } catch {
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markAllRead() {
    await notificationsApi.markAllAsRead();
    const readAt = new Date().toISOString();
    setItems((current) =>
      current.map((item) => ({ ...item, isRead: true, readAt: item.readAt ?? readAt })),
    );
  }

  async function markRead(id: string) {
    const updated = await notificationsApi.markAsRead(id);
    setItems((current) => current.map((item) => (item.id === id ? updated : item)));
  }

  async function archive(id: string) {
    await notificationsApi.archive(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Notifications</p>
          <h1 className="text-foreground text-2xl font-semibold">Notification Center</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="border-border bg-card text-muted-foreground hover:bg-secondary inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={unreadCount === 0}
            className="bg-accent text-accent-foreground hover:bg-accent/90 disabled:bg-muted disabled:text-muted-foreground inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm disabled:cursor-not-allowed"
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        </div>
      </div>

      <div className="border-border bg-card rounded-2xl border p-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => setCategory(filter.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                category === filter.value
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        {loading && <p className="text-muted-foreground p-6 text-sm">Loading notifications…</p>}
        {error && (
          <p className="text-muted-foreground p-6 text-sm">Could not load notifications.</p>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <Bell className="text-muted-foreground" size={28} />
            <div>
              <h2 className="text-foreground text-sm font-medium">No notifications</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                This category has no active notifications.
              </p>
            </div>
          </div>
        )}
        {!loading &&
          !error &&
          items.map((item) => {
            const { Icon, iconClassName } = getNotificationVisual(item.type);
            const content = (
              <div className="flex min-w-0 flex-1 gap-3">
                <div className={`mt-0.5 h-fit rounded-lg p-2 ${iconClassName}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-foreground text-sm font-semibold">{item.title}</h2>
                    {!item.isRead && <span className="bg-accent h-2 w-2 rounded-full" />}
                    <span className="border-border text-muted-foreground rounded-full border px-2 py-0.5 text-[11px]">
                      {categoryLabel(item.category)}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${priorityClass(item.priority)}`}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">{item.body}</p>
                  <p className="text-muted-foreground mt-2 text-xs">{formatDate(item.createdAt)}</p>
                </div>
              </div>
            );

            return (
              <div key={item.id} className="border-border flex gap-3 border-b p-4 last:border-b-0">
                {item.link ? (
                  <Link href={item.link} className="min-w-0 flex-1">
                    {content}
                  </Link>
                ) : (
                  content
                )}
                <div className="flex shrink-0 flex-col gap-2">
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => void markRead(item.id)}
                      className="text-muted-foreground hover:bg-secondary rounded-lg p-2"
                      aria-label="Mark as read"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void archive(item.id)}
                    className="text-muted-foreground hover:bg-secondary rounded-lg p-2"
                    aria-label="Archive"
                  >
                    <Archive size={16} />
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
