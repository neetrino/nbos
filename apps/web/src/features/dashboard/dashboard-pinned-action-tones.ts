import type { ActionTileTone } from '@/components/shared';
import type { DashboardPinnedActionKey } from './dashboard-control-registry';

const PINNED_ACTION_TONE_BY_KEY: Record<DashboardPinnedActionKey, ActionTileTone> = {
  'new-lead': 'emerald',
  'new-task': 'sky',
  'open-deals': 'violet',
  'open-my-workspaces': 'sky',
  'open-products': 'amber',
  'open-invoices': 'amber',
  'open-expenses': 'emerald',
  'open-payroll': 'emerald',
  'open-tasks': 'primary',
  'open-support': 'amber',
  'open-calendar': 'primary',
  'open-messenger': 'secondary',
  'open-credentials': 'secondary',
  'mail-inbox': 'neutral',
};

export function getPinnedActionTone(key: DashboardPinnedActionKey): ActionTileTone {
  return PINNED_ACTION_TONE_BY_KEY[key];
}

/** Min height for pinned tiles in the dashboard grid. */
export const DASHBOARD_PINNED_TILE_MIN_HEIGHT_CLASS = 'min-h-[4.75rem]';
