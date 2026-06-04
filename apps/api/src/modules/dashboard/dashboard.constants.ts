export const DASHBOARD_PINNED_ACTION_MAX_COUNT = 12;
export const DASHBOARD_WIDGET_MAX_COUNT = 12;

export const DASHBOARD_PINNED_ACTION_KEYS = [
  'new-lead',
  'new-task',
  'open-deals',
  'open-my-workspaces',
  'open-products',
  'open-invoices',
  'open-expenses',
  'open-payroll',
  'open-tasks',
  'open-support',
  'open-calendar',
  'open-messenger',
  'open-credentials',
  'mail-inbox',
] as const;

export const DASHBOARD_WIDGET_KEYS = [
  'new-leads',
  'open-deals',
  'open-support-tickets',
  'open-tasks',
] as const;

export type DashboardPinnedActionKey = (typeof DASHBOARD_PINNED_ACTION_KEYS)[number];
export type DashboardWidgetKey = (typeof DASHBOARD_WIDGET_KEYS)[number];
