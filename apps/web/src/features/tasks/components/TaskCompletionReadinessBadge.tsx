import { StatusBadge } from '@/components/shared';
import type { Task } from '@/lib/api/tasks';
import {
  buildTaskCompletionBlockers,
  getEnabledCompletionRules,
} from '@/features/tasks/utils/task-completion-readiness';

interface TaskCompletionReadinessBadgeProps {
  task: Task;
}

export function TaskCompletionReadinessBadge({ task }: TaskCompletionReadinessBadgeProps) {
  const rules = getEnabledCompletionRules(task);
  if (rules.length === 0) return null;

  const blockers = buildTaskCompletionBlockers(task);
  if (blockers.length > 0) {
    return <StatusBadge label="Completion blocked" variant="red" />;
  }

  return <StatusBadge label="Completion ready" variant="green" />;
}
