import type { ViewModeOption } from '@/components/shared';
import { TASKS_BOARD_VIEW_SEGMENTS } from '@/features/tasks/tasks-board-view-segments';
import type { TasksListBoardView } from '@/features/tasks/tasks-list-types';

const VIEW_MESSAGE_KEY: Record<
  TasksListBoardView,
  'deadline' | 'myPlan' | 'board' | 'list' | 'planning'
> = {
  deadline: 'deadline',
  'my-plan': 'myPlan',
  kanban: 'board',
  list: 'list',
  planning: 'planning',
};

/** Deadline / My Plan / Board / List chrome. Persisted view values stay English. */
export function buildTasksListViewOptions(
  t: (key: `views.${(typeof VIEW_MESSAGE_KEY)[TasksListBoardView]}`) => string,
): ViewModeOption<TasksListBoardView>[] {
  return TASKS_BOARD_VIEW_SEGMENTS.map((segment) => {
    const label = t(`views.${VIEW_MESSAGE_KEY[segment.value]}`);
    return {
      value: segment.value,
      label,
      icon: segment.icon,
      ariaLabel: label,
    };
  });
}
