import { CheckSquare } from 'lucide-react';
import type { EntityItemSummary } from '@/components/shared/entity-item';
import { getTaskStatus } from '@/features/tasks/constants/tasks';
import type { Task } from '@/lib/api/tasks';

function formatTaskDueDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return new Date(value).toLocaleDateString();
}

/** Maps a task API row to the shared entity tab preview model. */
export function taskToItemSummary(task: Task): EntityItemSummary {
  const statusInfo = getTaskStatus(task.status);
  return {
    id: task.id,
    kind: 'task',
    title: task.title,
    subtitle: task.workspace?.name ?? undefined,
    status: statusInfo ? { label: statusInfo.label, variant: statusInfo.variant } : undefined,
    trailing: formatTaskDueDate(task.dueDate),
    leadingIcon: CheckSquare,
  };
}
