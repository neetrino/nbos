import type { FilterConfig } from '@/components/shared';
import { TASK_PRIORITIES, TASK_STATUSES } from '@/features/tasks/constants/tasks';
import {
  BOARD_LIFECYCLE_SCOPE_OPTIONS,
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';

export type TasksListCopyFn = {
  (key: `filters.${'status' | 'stage' | 'urgency' | 'allStage' | 'allUrgency'}`): string;
  (key: `scope.${BoardLifecycleScope}`): string;
  (key: `status.${(typeof TASK_STATUSES)[number]['value']}`): string;
  (key: `priority.${(typeof TASK_PRIORITIES)[number]['value']}`): string;
};

/** Filter chrome for the Tasks list. Values stay persisted English codes. */
export function buildTasksFilterConfigs(t: TasksListCopyFn): FilterConfig[] {
  return [
    {
      key: 'boardScope',
      label: t('filters.status'),
      includeAllOption: false,
      defaultOptionValue: DEFAULT_BOARD_LIFECYCLE_SCOPE,
      options: BOARD_LIFECYCLE_SCOPE_OPTIONS.map((option) => ({
        value: option.value,
        label: t(`scope.${option.value}`),
      })),
    },
    {
      key: 'status',
      label: t('filters.stage'),
      allOptionLabel: t('filters.allStage'),
      options: TASK_STATUSES.map((status) => ({
        value: status.value,
        label: t(`status.${status.value}`),
      })),
    },
    {
      key: 'priority',
      label: t('filters.urgency'),
      allOptionLabel: t('filters.allUrgency'),
      options: TASK_PRIORITIES.map((priority) => ({
        value: priority.value,
        label: t(`priority.${priority.value}`),
      })),
    },
  ];
}
