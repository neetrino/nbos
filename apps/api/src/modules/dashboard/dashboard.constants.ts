export const DASHBOARD_PINNED_ACTION_MAX_COUNT = 12;
export const DASHBOARD_WIDGET_MAX_COUNT = 12;

export const DASHBOARD_PINNED_ACTION_KEYS = [
  'new-lead',
  'new-task',
  'open-invoices',
  'open-calendar',
  'open-messenger',
  'mail-inbox',
] as const;

export const DASHBOARD_WIDGET_KEYS = [
  'open-deals',
  'open-tasks',
  'open-support-tickets',
  'detailed-reports',
] as const;

export type DashboardPinnedActionKey = (typeof DASHBOARD_PINNED_ACTION_KEYS)[number];
export type DashboardWidgetKey = (typeof DASHBOARD_WIDGET_KEYS)[number];
