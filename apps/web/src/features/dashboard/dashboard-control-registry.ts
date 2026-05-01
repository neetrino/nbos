import {
  Calendar,
  CheckSquare,
  FileText,
  FolderKanban,
  Handshake,
  Headphones,
  KeyRound,
  Mail,
  MessageCircle,
  Plus,
  ReceiptText,
} from 'lucide-react';
import type {
  DashboardMetricProjection,
  DashboardPersonalLink as ApiDashboardPersonalLink,
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

export type DashboardPersonalLink = ApiDashboardPersonalLink;
export type DashboardData = DashboardMetricProjection;
export type DashboardPreference = DashboardPreferenceProjection;
export type DashboardPinnedActionKey =
  | 'new-lead'
  | 'new-task'
  | 'open-deals'
  | 'open-my-workspaces'
  | 'open-products'
  | 'open-invoices'
  | 'open-expenses'
  | 'open-payroll'
  | 'open-tasks'
  | 'open-support'
  | 'open-calendar'
  | 'open-messenger'
  | 'open-credentials'
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
    key: 'open-deals',
    label: 'Open deals',
    href: '/crm/deals',
    icon: Handshake,
    module: 'CRM_DEALS',
    action: 'VIEW',
    description: 'Review active sales pipeline.',
  },
  {
    key: 'open-my-workspaces',
    label: 'My Work Spaces',
    href: '/work-spaces',
    icon: FolderKanban,
    module: 'TASKS',
    action: 'VIEW',
    description: 'Jump into active delivery spaces.',
  },
  {
    key: 'open-products',
    label: 'Product board',
    href: '/projects/products',
    icon: FolderKanban,
    module: 'PRODUCTS',
    action: 'VIEW',
    description: 'Track product and extension delivery.',
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
    key: 'open-expenses',
    label: 'Expense board',
    href: '/finance/expenses',
    icon: ReceiptText,
    module: 'EXPENSES',
    action: 'VIEW',
    description: 'Review expenses and payment status.',
  },
  {
    key: 'open-payroll',
    label: 'Salary board',
    href: '/finance/payroll',
    icon: FileText,
    module: 'PAYROLL',
    action: 'VIEW',
    description: 'Review salary and payroll runs.',
  },
  {
    key: 'open-tasks',
    label: 'My tasks',
    href: '/tasks',
    icon: CheckSquare,
    module: 'TASKS',
    action: 'VIEW',
    description: 'Open task board for work in progress.',
  },
  {
    key: 'open-support',
    label: 'Support queue',
    href: '/support',
    icon: Headphones,
    module: 'SUPPORT',
    action: 'VIEW',
    description: 'Open tickets waiting for action.',
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
    key: 'open-credentials',
    label: 'Credentials vault',
    href: '/credentials',
    icon: KeyRound,
    module: 'CREDENTIALS',
    action: 'VIEW',
    description: 'Open shared credentials you can access.',
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
