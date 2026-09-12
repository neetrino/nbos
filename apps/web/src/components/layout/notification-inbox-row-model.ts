import { cn } from '@/lib/utils';
import {
  NOTIFICATION_INBOX_ROW_BASE_CLASS,
  NOTIFICATION_INBOX_ROW_UNREAD_CLASS,
} from './notification-inbox-sheet-classes';

export interface NotificationInboxRowSource {
  title: string;
  body: string;
  isRead: boolean;
  link: string | null;
}

export interface NotificationInboxRowModel {
  title: string;
  body: string;
  unread: boolean;
  href: string | null;
  surfaceClassName: string;
}

/** Presentation for one inbox card strip (title, body, unread surface). */
export function resolveNotificationInboxRowModel(
  notification: NotificationInboxRowSource,
): NotificationInboxRowModel {
  const unread = !notification.isRead;
  return {
    title: notification.title,
    body: notification.body,
    unread,
    href: notification.link,
    surfaceClassName: cn(
      NOTIFICATION_INBOX_ROW_BASE_CLASS,
      unread ? NOTIFICATION_INBOX_ROW_UNREAD_CLASS : null,
    ),
  };
}
