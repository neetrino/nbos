import type { FilterConfig } from '@/components/shared';
import {
  BOARD_LIFECYCLE_SCOPE_OPTIONS,
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
} from '@/features/shared/board-lifecycle';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_WAITING_OVERLAY_OPTIONS,
} from '@/features/support/constants/support';

export const SUPPORT_TICKET_FILTER_CONFIGS: FilterConfig[] = [
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
    key: 'category',
    label: 'Category',
    options: TICKET_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
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
