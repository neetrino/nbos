'use client';

import Link from 'next/link';
import type { NotificationDto } from '@/lib/api/notifications';
import { getNotificationVisual } from '@/lib/notifications/notification-type-visual';
import { resolveNotificationInboxRowModel } from './notification-inbox-row-model';
import {
  NOTIFICATION_INBOX_BODY_TEXT_CLASS,
  NOTIFICATION_INBOX_CLOCK_CLASS,
  NOTIFICATION_INBOX_ICON_WRAP_CLASS,
  NOTIFICATION_INBOX_TIME_CLASS,
  NOTIFICATION_INBOX_TITLE_TEXT_CLASS,
  NOTIFICATION_INBOX_UNREAD_DOT_CLASS,
} from './notification-inbox-sheet-classes';

export interface NotificationInboxRowProps {
  notification: NotificationDto;
  relativeLabel: string;
  clockLabel: string;
  onOpen: (notification: NotificationDto) => void;
}

export function NotificationInboxRow({
  notification,
  relativeLabel,
  clockLabel,
  onOpen,
}: NotificationInboxRowProps) {
  const { Icon, iconClassName } = getNotificationVisual(notification.type);
  const model = resolveNotificationInboxRowModel(notification);
  const inner = (
    <>
      <div className={`${NOTIFICATION_INBOX_ICON_WRAP_CLASS} ${iconClassName}`}>
        <Icon size={18} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={NOTIFICATION_INBOX_TITLE_TEXT_CLASS}>{model.title}</p>
          {model.unread ? (
            <span className={NOTIFICATION_INBOX_UNREAD_DOT_CLASS} aria-hidden />
          ) : null}
        </div>
        {model.body ? <p className={NOTIFICATION_INBOX_BODY_TEXT_CLASS}>{model.body}</p> : null}
      </div>
      <div className={NOTIFICATION_INBOX_TIME_CLASS}>
        <span>{relativeLabel}</span>
        {clockLabel ? <span className={NOTIFICATION_INBOX_CLOCK_CLASS}>{clockLabel}</span> : null}
      </div>
    </>
  );

  if (model.href) {
    return (
      <Link
        href={model.href}
        className={model.surfaceClassName}
        onClick={() => onOpen(notification)}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className={model.surfaceClassName} onClick={() => onOpen(notification)}>
      {inner}
    </button>
  );
}
