import type { FilterConfig } from '@/components/shared';
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_WAITING_OVERLAY_OPTIONS,
} from '@/features/support/constants/support';
import { getSupportBoardScopeFilterConfig } from '@/features/support/constants/support-board-scope-filter';
import {
  translateSupportPriority,
  translateSupportStatus,
  translateSupportWaiting,
  type SupportTranslator,
} from '@/features/support/support-message-keys';

/** Change Control queue filters — category is fixed to CHANGE_REQUEST. */
export function getSupportChangeControlFilterConfigs(
  translate?: SupportTranslator,
): FilterConfig[] {
  return [
    getSupportBoardScopeFilterConfig(translate),
    {
      key: 'priority',
      label: translate ? translate('filters.priority') : 'Priority',
      options: TICKET_PRIORITIES.map((item) => ({
        value: item.value,
        label: translate ? translateSupportPriority(translate, item.value, item.label) : item.label,
      })),
    },
    {
      key: 'status',
      label: translate ? translate('filters.status') : 'Status',
      options: TICKET_STATUSES.map((item) => ({
        value: item.value,
        label: translate ? translateSupportStatus(translate, item.value, item.label) : item.label,
      })),
    },
    {
      key: 'waitingState',
      label: translate ? translate('filters.waiting') : 'Waiting',
      allOptionLabel: translate ? translate('waiting.all') : 'All waiting states',
      options: TICKET_WAITING_OVERLAY_OPTIONS.map((item) => ({
        value: item.value,
        label: translate ? translateSupportWaiting(translate, item.value, item.label) : item.label,
      })),
    },
  ];
}

export const SUPPORT_CHANGE_CONTROL_FILTER_CONFIGS: FilterConfig[] =
  getSupportChangeControlFilterConfigs();
