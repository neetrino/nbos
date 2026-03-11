'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  UserPlus,
  FolderKanban,
} from 'lucide-react';

interface Notification {
  id: string;
  icon: typeof Bell;
  iconClassName: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    icon: AlertTriangle,
    iconClassName: 'bg-red-500/10 text-red-600',
    title: 'Deployment failed',
    body: 'Production build for NBOS Platform failed at step 3/5.',
    time: '2026-03-11T09:30:00Z',
    read: false,
  },
  {
    id: '2',
    icon: UserPlus,
    iconClassName: 'bg-blue-500/10 text-blue-600',
    title: 'New team member',
    body: 'Lilit M. joined the Client Portal project.',
    time: '2026-03-11T08:15:00Z',
    read: false,
  },
  {
    id: '3',
    icon: CheckCircle2,
    iconClassName: 'bg-emerald-500/10 text-emerald-600',
    title: 'Task completed',
    body: 'Davit S. marked "Fix auth token refresh" as done.',
    time: '2026-03-10T17:45:00Z',
    read: false,
  },
  {
    id: '4',
    icon: MessageSquare,
    iconClassName: 'bg-violet-500/10 text-violet-600',
    title: 'New comment',
    body: 'Arman K. commented on invoice INV-2024-031.',
    time: '2026-03-10T14:00:00Z',
    read: true,
  },
  {
    id: '5',
    icon: FolderKanban,
    iconClassName: 'bg-amber-500/10 text-amber-600',
    title: 'Project archived',
    body: 'Legacy Dashboard has been moved to archive.',
    time: '2026-03-09T10:30:00Z',
    read: true,
  },
];

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-muted-foreground hover:bg-secondary hover:text-foreground relative rounded-lg p-2 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="bg-accent text-accent-foreground absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="border-border bg-card absolute top-full right-0 mt-2 w-80 rounded-2xl border shadow-xl">
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-foreground text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-accent hover:text-accent/80 text-xs font-medium transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div
                  key={notification.id}
                  className={`hover:bg-secondary/50 flex gap-3 px-4 py-3 transition-colors ${
                    !notification.read ? 'bg-secondary/30' : ''
                  }`}
                >
                  <div className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${notification.iconClassName}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-foreground truncate text-xs font-medium">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="bg-accent h-1.5 w-1.5 shrink-0 rounded-full" />
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[11px] leading-relaxed">
                      {notification.body}
                    </p>
                    <p className="text-muted-foreground mt-1 text-[10px]">
                      {formatRelativeTime(notification.time)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-border border-t px-4 py-2.5 text-center">
            <button className="text-accent hover:text-accent/80 text-xs font-medium transition-colors">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
