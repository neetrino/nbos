import { Checkbox } from '@/components/ui/checkbox';
import { DETAIL_SHEET_SECTION_TITLE_CLASS } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { Task } from '@/lib/api/tasks';

interface TaskSubtasksSectionProps {
  task: Task;
}

export function TaskSubtasksSection({ task }: TaskSubtasksSectionProps) {
  if (task.subtasks.length === 0) return null;

  const completedCount = task.subtasks.filter(
    (subtask) => subtask.status === 'COMPLETED' || subtask.status === 'DONE',
  ).length;

  return (
    <div>
      <h4 className={cn(DETAIL_SHEET_SECTION_TITLE_CLASS, 'mb-2')}>
        Subtasks ({completedCount}/{task.subtasks.length})
      </h4>
      <div className="space-y-1">
        {task.subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={subtask.status === 'COMPLETED' || subtask.status === 'DONE'}
              disabled
            />
            <span
              className={
                subtask.status === 'COMPLETED' || subtask.status === 'DONE'
                  ? 'text-muted-foreground line-through'
                  : ''
              }
            >
              {subtask.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
