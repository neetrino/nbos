import type { FilterConfig } from '@/components/shared';
import {
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import type { SupportTranslator } from '@/features/support/support-message-keys';

const BOARD_SCOPE_VALUES: BoardLifecycleScope[] = ['ALL', 'ACTIVE', 'CLOSED'];

const BOARD_SCOPE_FALLBACK: Record<BoardLifecycleScope, string> = {
  ALL: 'All statuses',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
};

export function getSupportBoardScopeFilterConfig(translate?: SupportTranslator): FilterConfig {
  return {
    key: 'boardScope',
    label: translate ? translate('filters.status') : 'Status',
    includeAllOption: false,
    defaultOptionValue: DEFAULT_BOARD_LIFECYCLE_SCOPE,
    options: BOARD_SCOPE_VALUES.map((value) => ({
      value,
      label: translate ? translate(`scope.${value}`) : BOARD_SCOPE_FALLBACK[value],
    })),
  };
}
