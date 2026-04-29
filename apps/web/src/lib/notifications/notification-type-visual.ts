import type { LucideIcon } from 'lucide-react';
import { Bell, Mail } from 'lucide-react';
import { MAIL_NOTIFICATION_TYPE_ACCOUNT_SYNC_STUB } from './notification-types';

export interface NotificationVisual {
  Icon: LucideIcon;
  iconClassName: string;
}

const MAIL_VISUAL: NotificationVisual = {
  Icon: Mail,
  iconClassName: 'bg-sky-500/10 text-sky-600',
};

export function getNotificationVisual(type: string): NotificationVisual {
  if (type === MAIL_NOTIFICATION_TYPE_ACCOUNT_SYNC_STUB) {
    return MAIL_VISUAL;
  }
  if (type.startsWith('mail.')) {
    return MAIL_VISUAL;
  }
  return {
    Icon: Bell,
    iconClassName: 'bg-muted text-muted-foreground',
  };
}
