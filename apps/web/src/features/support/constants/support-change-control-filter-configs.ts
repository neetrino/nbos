import type { FilterConfig } from '@/components/shared';
import {
  BOARD_LIFECYCLE_SCOPE_OPTIONS,
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
} from '@/features/shared/board-lifecycle';
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_WAITING_OVERLAY_OPTIONS,
} from '@/features/support/constants/support';

/** Change Control queue filters — category is fixed to CHANGE_REQUEST. */
export const SUPPORT_CHANGE_CONTROL_FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'boardScope',
    label: 'Status',
    includeAllOption: false,
    defaultOptionValue: DEFAULT_BOARD_LIFECYCLE_SCOPE,
    options: BOARD_LIFECYCLE_SCOPE_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  },
  {
    key: 'priority',
    label: 'Priority',
    options: TICKET_PRIORITIES.map((p) => ({ value: p.value, label: p.label })),
  },
  {
    key: 'status',
    label: 'Status',
    options: TICKET_STATUSES.map((s) => ({ value: s.value, label: s.label })),
  },
  {
    key: 'waitingState',
    label: 'Waiting',
    options: TICKET_WAITING_OVERLAY_OPTIONS.map((w) => ({ value: w.value, label: w.label })),
  },
];
