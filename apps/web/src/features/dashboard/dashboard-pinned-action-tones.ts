import type { ActionTileTone } from '@/components/shared';
import type { DashboardPinnedActionKey } from './dashboard-control-registry';

const PINNED_ACTION_TONE_BY_KEY: Record<DashboardPinnedActionKey, ActionTileTone> = {
  'new-lead': 'emerald',
  'new-task': 'sky',
  'new-meeting': 'primary',
  'new-expense': 'emerald',
  'open-deals': 'violet',
  'open-products': 'amber',
  'open-invoices': 'amber',
  'open-expenses': 'emerald',
  'open-payroll': 'emerald',
  'open-support': 'amber',
  'open-credentials': 'secondary',
};

export function getPinnedActionTone(key: DashboardPinnedActionKey): ActionTileTone {
  return PINNED_ACTION_TONE_BY_KEY[key];
}

/** Min height for pinned tiles in the dashboard grid. */
export const DASHBOARD_PINNED_TILE_MIN_HEIGHT_CLASS = 'min-h-[4.75rem]';
