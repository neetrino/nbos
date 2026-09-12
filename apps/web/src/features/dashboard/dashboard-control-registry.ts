import {
  CalendarPlus,
  CheckSquare,
  FileText,
  FolderKanban,
  Handshake,
  Headphones,
  KeyRound,
  ListPlus,
  Plus,
  ReceiptText,
  UserPlus,
} from 'lucide-react';
import type {
  DashboardMetricProjection,
  DashboardNote as ApiDashboardNote,
  DashboardPersonalLink as ApiDashboardPersonalLink,
  DashboardPreferenceProjection,
  DashboardPriorityProjection,
} from '@/lib/api/dashboard';

export type PinnedActionKind = 'create' | 'open';

interface PinnedActionBase {
  key: DashboardPinnedActionKey;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  module: string;
  action: string;
  description: string;
}

export type PinnedAction =
  | (PinnedActionBase & { kind: 'create' })
  | (PinnedActionBase & { kind: 'open'; href: string });

export type DashboardPersonalLink = ApiDashboardPersonalLink;
export type DashboardNote = ApiDashboardNote;
export type DashboardData = DashboardMetricProjection;
export type DashboardPreference = DashboardPreferenceProjection;
export type DashboardPinnedActionKey =
  | 'new-lead'
  | 'new-task'
  | 'new-meeting'
  | 'new-expense'
  | 'open-deals'
  | 'open-products'
  | 'open-invoices'
  | 'open-expenses'
  | 'open-payroll'
  | 'open-support'
  | 'open-credentials';
export type DashboardWidgetKey = 'leads' | 'open-deals' | 'open-tasks' | 'open-support-tickets';
export type PriorityCard = DashboardPriorityProjection;

export const PINNED_ACTIONS: PinnedAction[] = [
  {
    key: 'new-task',
    kind: 'create',
    label: 'New task',
    icon: ListPlus,
    module: 'TASKS',
    action: 'ADD',
    description: 'Create work for yourself or a teammate.',
  },
  {
    key: 'new-meeting',
    kind: 'create',
    label: 'New meeting',
    icon: CalendarPlus,
    module: 'CALENDAR',
    action: 'ADD',
    description: 'Schedule a client meeting without leaving the desk.',
  },
  {
    key: 'new-lead',
    kind: 'create',
    label: 'New lead',
    icon: UserPlus,
    module: 'CRM_LEADS',
    action: 'ADD',
    description: 'Capture an incoming opportunity.',
  },
  {
    key: 'new-expense',
    kind: 'create',
    label: 'New expense',
    icon: ReceiptText,
    module: 'FINANCE_EXPENSES',
    action: 'ADD',
    description: 'Log an expense from the desk.',
  },
  {
    key: 'open-deals',
    kind: 'open',
    label: 'Open deals',
    href: '/crm/deals',
    icon: Handshake,
    module: 'CRM_DEALS',
    action: 'VIEW',
    description: 'Review active sales pipeline.',
  },
  {
    key: 'open-products',
    kind: 'open',
    label: 'Delivery Board',
    href: '/delivery-board',
    icon: FolderKanban,
    module: 'PRODUCTS',
    action: 'VIEW',
    description: 'Track Product and Extension delivery lifecycle and stage gates.',
  },
  {
    key: 'open-invoices',
    kind: 'open',
    label: 'Open invoices',
    href: '/finance/invoices',
    icon: FileText,
    module: 'FINANCE_INVOICES',
    action: 'VIEW',
    description: 'Review pending invoice work.',
  },
  {
    key: 'open-expenses',
    kind: 'open',
    label: 'Pay now',
    href: '/finance/expenses',
    icon: ReceiptText,
    module: 'EXPENSES',
    action: 'VIEW',
    description: 'Review expenses and payment status.',
  },
  {
    key: 'open-payroll',
    kind: 'open',
    label: 'Salary',
    href: '/finance/payroll',
    icon: FileText,
    module: 'PAYROLL',
    action: 'VIEW',
    description: 'Review salary and payroll runs.',
  },
  {
    key: 'open-support',
    kind: 'open',
    label: 'Support queue',
    href: '/support',
    icon: Headphones,
    module: 'SUPPORT',
    action: 'VIEW',
    description: 'Open tickets waiting for action.',
  },
  {
    key: 'open-credentials',
    kind: 'open',
    label: 'Credentials vault',
    href: '/credentials',
    icon: KeyRound,
    module: 'CREDENTIALS',
    action: 'VIEW',
    description: 'Open shared credentials you can access.',
  },
];

export const MINI_METRICS = [
  {
    id: 'leads',
    icon: Plus,
    labelKey: 'widgets.metrics.leads',
    label: 'Leads',
    key: 'leads',
    href: '/crm/leads',
  },
  {
    id: 'open-deals',
    icon: Handshake,
    labelKey: 'widgets.metrics.openDeals',
    label: 'Open deals',
    key: 'openDeals',
    href: '/crm/deals',
  },
  {
    id: 'open-support-tickets',
    icon: Headphones,
    labelKey: 'widgets.metrics.openTickets',
    label: 'Open tickets',
    key: 'openTickets',
    href: '/support',
  },
  {
    id: 'open-tasks',
    icon: CheckSquare,
    labelKey: 'widgets.metrics.openTasks',
    label: 'Open tasks',
    key: 'openTasks',
    href: '/tasks',
  },
] as const;

export type MiniMetricDefinition = (typeof MINI_METRICS)[number];

/** Split mini widgets into visible vs hidden lists, preserving saved order where set. */
export function partitionMiniMetrics(
  hiddenWidgetIds: readonly string[],
  visibleWidgetOrder: readonly string[],
): { visible: MiniMetricDefinition[]; hidden: MiniMetricDefinition[] } {
  const byId = new Map<string, MiniMetricDefinition>(MINI_METRICS.map((m) => [m.id, m]));
  const hiddenSet = new Set(hiddenWidgetIds);

  const hidden = hiddenWidgetIds.flatMap((id) => {
    const metric = byId.get(id);
    return metric ? [metric] : [];
  });

  const seen = new Set<string>();
  const visible: MiniMetricDefinition[] = [];

  const pushIfVisible = (id: string) => {
    if (seen.has(id) || hiddenSet.has(id)) return;
    const metric = byId.get(id);
    if (!metric) return;
    visible.push(metric);
    seen.add(id);
  };

  if (visibleWidgetOrder.length > 0) {
    for (const id of visibleWidgetOrder) pushIfVisible(id);
  }
  for (const metric of MINI_METRICS) pushIfVisible(metric.id);

  return { visible, hidden };
}

export function priorityClass(severity: PriorityCard['severity']): string {
  if (severity === 'critical') return 'border-red-200 bg-red-50 text-red-800';
  if (severity === 'high') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-border bg-card text-foreground';
}
