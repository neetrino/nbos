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
import type { DashboardMetricProjection, DashboardPriorityProjection } from '@/lib/api/dashboard';

export interface PinnedAction {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  module: string;
  action: string;
  description: string;
}

export type DashboardData = DashboardMetricProjection;
export type PriorityCard = DashboardPriorityProjection;

export const PINNED_ACTIONS: PinnedAction[] = [
  {
    label: 'New lead',
    href: '/crm/leads',
    icon: Plus,
    module: 'CRM_LEADS',
    action: 'ADD',
    description: 'Capture an incoming opportunity.',
  },
  {
    label: 'New task',
    href: '/tasks',
    icon: CheckSquare,
    module: 'TASKS',
    action: 'ADD',
    description: 'Create work for yourself or a teammate.',
  },
  {
    label: 'Open invoices',
    href: '/finance/invoices',
    icon: FileText,
    module: 'FINANCE_INVOICES',
    action: 'VIEW',
    description: 'Review pending invoice work.',
  },
  {
    label: 'Open calendar',
    href: '/calendar',
    icon: Calendar,
    module: 'CALENDAR',
    action: 'VIEW',
    description: 'See meetings, personal items and deadlines.',
  },
  {
    label: 'Open messenger',
    href: '/messenger',
    icon: MessageCircle,
    module: 'MESSENGER',
    action: 'VIEW',
    description: 'Jump into internal communication.',
  },
  {
    label: 'Mail inbox',
    href: '/mail',
    icon: Mail,
    module: 'MAIL',
    action: 'VIEW',
    description: 'Check mailbox threads requiring context.',
  },
];

export const MINI_METRICS = [
  { icon: Handshake, label: 'Open deals', key: 'openDeals' },
  { icon: CheckSquare, label: 'Open tasks', key: 'openTasks' },
  { icon: Headphones, label: 'Open support tickets', key: 'openTickets' },
  { icon: FolderKanban, label: 'Detailed reports', value: 'Open catalog', href: '/reports' },
] as const;

export function priorityClass(severity: PriorityCard['severity']): string {
  if (severity === 'critical') return 'border-red-200 bg-red-50 text-red-800';
  if (severity === 'high') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-border bg-card text-foreground';
}
