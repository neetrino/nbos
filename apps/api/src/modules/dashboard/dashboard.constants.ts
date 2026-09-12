export const DASHBOARD_PINNED_ACTION_MAX_COUNT = 20;
export const DASHBOARD_WIDGET_MAX_COUNT = 12;

export const DASHBOARD_PINNED_ACTION_KEYS = [
  'new-lead',
  'new-task',
  'new-meeting',
  'new-expense',
  'open-deals',
  'open-products',
  'open-invoices',
  'open-expenses',
  'open-payroll',
  'open-support',
  'open-credentials',
] as const;

export const DASHBOARD_WIDGET_KEYS = [
  'leads',
  'open-deals',
  'open-support-tickets',
  'open-tasks',
] as const;

export type DashboardPinnedActionKey = (typeof DASHBOARD_PINNED_ACTION_KEYS)[number];
export type DashboardWidgetKey = (typeof DASHBOARD_WIDGET_KEYS)[number];

/** Stable codes for dashboard priority cards. English title/context remain for older clients. */
export const DASHBOARD_PRIORITY_CODES = [
  'critical_tickets',
  'tasks_due_today',
  'pending_invoices',
] as const;

export type DashboardPriorityCode = (typeof DASHBOARD_PRIORITY_CODES)[number];
