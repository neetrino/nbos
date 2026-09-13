import type { KanbanColumnQuickCreateConfig } from '@/components/shared/kanban/kanban.types';
import type { Task } from '@/lib/api/tasks';

/** Column-top Quick Task — hidden on mobile; create lives in the dock. */
export function createTaskKanbanQuickCreateConfig(
  onOpenCreateDialog: (columnKey: string) => void,
  buttonLabel = 'Quick',
): KanbanColumnQuickCreateConfig<Task> {
  return {
    isEnabled: () => true,
    hideOnMobile: true,
    buttonLabel,
    onOpenDialog: onOpenCreateDialog,
  };
}
