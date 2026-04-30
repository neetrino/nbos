import {
  Calendar,
  CheckSquare,
  FileText,
  FolderKanban,
  Handshake,
  Headphones,
  Mail,
  MessageCircle,
  Plus,
} from 'lucide-react';
import type {
  DashboardMetricProjection,
  DashboardPreferenceProjection,
  DashboardPriorityProjection,
} from '@/lib/api/dashboard';

export interface PinnedAction {
  key: DashboardPinnedActionKey;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  module: string;
  action: string;
  description: string;
}

export type DashboardData = DashboardMetricProjection;
export type DashboardPreference = DashboardPreferenceProjection;
export type DashboardPinnedActionKey =
  | 'new-lead'
  | 'new-task'
  | 'open-invoices'
  | 'open-calendar'
  | 'open-messenger'
  | 'mail-inbox';
export type DashboardWidgetKey =
  | 'open-deals'
  | 'open-tasks'
  | 'open-support-tickets'
  | 'detailed-reports';
export type PriorityCard = DashboardPriorityProjection;

export const PINNED_ACTIONS: PinnedAction[] = [
  {
    key: 'new-lead',
    label: 'New lead',
    href: '/crm/leads',
    icon: Plus,
    module: 'CRM_LEADS',
    action: 'ADD',
    description: 'Capture an incoming opportunity.',
  },
  {
    key: 'new-task',
    label: 'New task',
    href: '/tasks',
    icon: CheckSquare,
    module: 'TASKS',
    action: 'ADD',
    description: 'Create work for yourself or a teammate.',
  },
  {
    key: 'open-invoices',
    label: 'Open invoices',
    href: '/finance/invoices',
    icon: FileText,
    module: 'FINANCE_INVOICES',
    action: 'VIEW',
    description: 'Review pending invoice work.',
  },
  {
    key: 'open-calendar',
    label: 'Open calendar',
    href: '/calendar',
    icon: Calendar,
    module: 'CALENDAR',
    action: 'VIEW',
    description: 'See meetings, personal items and deadlines.',
  },
  {
    key: 'open-messenger',
    label: 'Open messenger',
    href: '/messenger',
    icon: MessageCircle,
    module: 'MESSENGER',
    action: 'VIEW',
    description: 'Jump into internal communication.',
  },
  {
    key: 'mail-inbox',
    label: 'Mail inbox',
    href: '/mail',
    icon: Mail,
    module: 'MAIL',
    action: 'VIEW',
    description: 'Check mailbox threads requiring context.',
  },
];

export const MINI_METRICS = [
  { id: 'open-deals', icon: Handshake, label: 'Open deals', key: 'openDeals' },
  { id: 'open-tasks', icon: CheckSquare, label: 'Open tasks', key: 'openTasks' },
  {
    id: 'open-support-tickets',
    icon: Headphones,
    label: 'Open support tickets',
    key: 'openTickets',
  },
  {
    id: 'detailed-reports',
    icon: FolderKanban,
    label: 'Detailed reports',
    value: 'Open catalog',
    href: '/reports',
  },
] as const;

export function priorityClass(severity: PriorityCard['severity']): string {
  if (severity === 'critical') return 'border-red-200 bg-red-50 text-red-800';
  if (severity === 'high') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-border bg-card text-foreground';
}
