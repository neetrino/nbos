import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Ban,
  Bell,
  CheckCircle2,
  FilePenLine,
  Flag,
  Handshake,
  LifeBuoy,
  ListTodo,
  Mail,
  RotateCcw,
  Send,
  Shield,
  Wallet,
} from 'lucide-react';
import {
  MAIL_NOTIFICATION_TYPE_ACCOUNT_SYNC_STUB,
  MAIL_NOTIFICATION_TYPE_OUTBOUND_DRAFT_CREATED_IN_APP,
  MAIL_NOTIFICATION_TYPE_OUTBOUND_FAILED_RESET_TO_DRAFT,
  MAIL_NOTIFICATION_TYPE_OUTBOUND_MESSAGE_CANCELLED,
  MAIL_NOTIFICATION_TYPE_OUTBOUND_MESSAGE_QUEUED_IN_APP,
  MAIL_NOTIFICATION_TYPE_OUTBOUND_SEND_STUB_FAILED,
  MAIL_NOTIFICATION_TYPE_THREAD_NEEDS_LINK_CLEARED,
  MAIL_NOTIFICATION_TYPE_THREAD_NEEDS_LINK_FLAGGED,
  OPS_NOTIFICATION_TYPE_BULLMQ_JOB_FAILED,
  OPS_NOTIFICATION_TYPE_SCHEDULER_RUN_FAILED,
} from './notification-types';

export interface NotificationVisual {
  Icon: LucideIcon;
  iconClassName: string;
}

const MAIL_VISUAL: NotificationVisual = {
  Icon: Mail,
  iconClassName: 'bg-sky-500/10 text-sky-600',
};

const TASK_VISUAL: NotificationVisual = {
  Icon: ListTodo,
  iconClassName: 'bg-indigo-500/10 text-indigo-700',
};

const FINANCE_VISUAL: NotificationVisual = {
  Icon: Wallet,
  iconClassName: 'bg-emerald-500/10 text-emerald-700',
};

const SUPPORT_VISUAL: NotificationVisual = {
  Icon: LifeBuoy,
  iconClassName: 'bg-orange-500/10 text-orange-700',
};

const CRM_VISUAL: NotificationVisual = {
  Icon: Handshake,
  iconClassName: 'bg-violet-500/10 text-violet-700',
};

const SECURITY_VISUAL: NotificationVisual = {
  Icon: Shield,
  iconClassName: 'bg-rose-500/10 text-rose-700',
};

const OPS_VISUAL: NotificationVisual = {
  Icon: AlertTriangle,
  iconClassName: 'bg-red-500/10 text-red-700',
};

const DEFAULT_VISUAL: NotificationVisual = {
  Icon: Bell,
  iconClassName: 'bg-muted text-muted-foreground',
};

const EXACT_VISUALS: Record<string, NotificationVisual> = {
  [MAIL_NOTIFICATION_TYPE_OUTBOUND_MESSAGE_CANCELLED]: {
    Icon: Ban,
    iconClassName: 'bg-muted text-muted-foreground',
  },
  [MAIL_NOTIFICATION_TYPE_OUTBOUND_FAILED_RESET_TO_DRAFT]: {
    Icon: RotateCcw,
    iconClassName: 'bg-violet-500/10 text-violet-700',
  },
  [MAIL_NOTIFICATION_TYPE_OUTBOUND_SEND_STUB_FAILED]: {
    Icon: AlertTriangle,
    iconClassName: 'bg-amber-500/10 text-amber-700',
  },
  [MAIL_NOTIFICATION_TYPE_OUTBOUND_MESSAGE_QUEUED_IN_APP]: {
    Icon: Send,
    iconClassName: 'bg-sky-500/10 text-sky-700',
  },
  [MAIL_NOTIFICATION_TYPE_OUTBOUND_DRAFT_CREATED_IN_APP]: {
    Icon: FilePenLine,
    iconClassName: 'bg-emerald-500/10 text-emerald-700',
  },
  [MAIL_NOTIFICATION_TYPE_ACCOUNT_SYNC_STUB]: MAIL_VISUAL,
  [MAIL_NOTIFICATION_TYPE_THREAD_NEEDS_LINK_FLAGGED]: {
    Icon: Flag,
    iconClassName: 'bg-amber-500/10 text-amber-800',
  },
  [MAIL_NOTIFICATION_TYPE_THREAD_NEEDS_LINK_CLEARED]: {
    Icon: CheckCircle2,
    iconClassName: 'bg-emerald-500/10 text-emerald-700',
  },
  [OPS_NOTIFICATION_TYPE_SCHEDULER_RUN_FAILED]: OPS_VISUAL,
  [OPS_NOTIFICATION_TYPE_BULLMQ_JOB_FAILED]: OPS_VISUAL,
};

const PREFIX_VISUALS: ReadonlyArray<readonly [string, NotificationVisual]> = [
  ['mail.', MAIL_VISUAL],
  ['tasks.', TASK_VISUAL],
  ['task.', TASK_VISUAL],
  ['finance.', FINANCE_VISUAL],
  ['support.', SUPPORT_VISUAL],
  ['crm.', CRM_VISUAL],
  ['credentials.', SECURITY_VISUAL],
  ['document.', SECURITY_VISUAL],
  ['ops.', OPS_VISUAL],
];

function visualForPrefix(type: string): NotificationVisual | null {
  for (const [prefix, visual] of PREFIX_VISUALS) {
    if (type.startsWith(prefix)) return visual;
  }
  return null;
}

export function getNotificationVisual(type: string): NotificationVisual {
  return EXACT_VISUALS[type] ?? visualForPrefix(type) ?? DEFAULT_VISUAL;
}
