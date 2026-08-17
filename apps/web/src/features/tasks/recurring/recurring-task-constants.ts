import type { RecurringFrequency } from '@/lib/api/recurring-tasks';

export const RECURRING_FREQUENCIES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
] as const satisfies ReadonlyArray<{ value: RecurringFrequency; label: string }>;

export const RECURRING_WEEKDAYS = [
  { value: 'MO', label: 'Mon' },
  { value: 'TU', label: 'Tue' },
  { value: 'WE', label: 'Wed' },
  { value: 'TH', label: 'Thu' },
  { value: 'FR', label: 'Fri' },
  { value: 'SA', label: 'Sat' },
  { value: 'SU', label: 'Sun' },
] as const;

export const RECURRING_DEFAULT_TIME = '09:00';
export const RECURRING_CHECKLIST_TITLE = 'Checklist';

export const RECURRING_STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
] as const;

export type RecurringStatusFilter = (typeof RECURRING_STATUS_TABS)[number]['value'];
