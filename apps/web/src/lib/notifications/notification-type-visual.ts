import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Ban, Bell, Mail, RotateCcw, Send } from 'lucide-react';
import {
  MAIL_NOTIFICATION_TYPE_ACCOUNT_SYNC_STUB,
  MAIL_NOTIFICATION_TYPE_OUTBOUND_FAILED_RESET_TO_DRAFT,
  MAIL_NOTIFICATION_TYPE_OUTBOUND_MESSAGE_CANCELLED,
  MAIL_NOTIFICATION_TYPE_OUTBOUND_MESSAGE_QUEUED_IN_APP,
  MAIL_NOTIFICATION_TYPE_OUTBOUND_SEND_STUB_FAILED,
} from './notification-types';

export interface NotificationVisual {
  Icon: LucideIcon;
  iconClassName: string;
}

const MAIL_VISUAL: NotificationVisual = {
  Icon: Mail,
  iconClassName: 'bg-sky-500/10 text-sky-600',
};

export function getNotificationVisual(type: string): NotificationVisual {
  if (type === MAIL_NOTIFICATION_TYPE_OUTBOUND_MESSAGE_CANCELLED) {
    return {
      Icon: Ban,
      iconClassName: 'bg-muted text-muted-foreground',
    };
  }
  if (type === MAIL_NOTIFICATION_TYPE_OUTBOUND_FAILED_RESET_TO_DRAFT) {
    return {
      Icon: RotateCcw,
      iconClassName: 'bg-violet-500/10 text-violet-700',
    };
  }
  if (type === MAIL_NOTIFICATION_TYPE_OUTBOUND_SEND_STUB_FAILED) {
    return {
      Icon: AlertTriangle,
      iconClassName: 'bg-amber-500/10 text-amber-700',
    };
  }
  if (type === MAIL_NOTIFICATION_TYPE_OUTBOUND_MESSAGE_QUEUED_IN_APP) {
    return {
      Icon: Send,
      iconClassName: 'bg-sky-500/10 text-sky-700',
    };
  }
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
