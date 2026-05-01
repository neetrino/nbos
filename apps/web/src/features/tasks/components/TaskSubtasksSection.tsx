import { Checkbox } from '@/components/ui/checkbox';
import type { Task } from '@/lib/api/tasks';

interface TaskSubtasksSectionProps {
  task: Task;
}

export function TaskSubtasksSection({ task }: TaskSubtasksSectionProps) {
  if (task.subtasks.length === 0) return null;

  const completedCount = task.subtasks.filter((subtask) => subtask.status === 'DONE').length;

  return (
    <div>
      <h4 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
        Subtasks ({completedCount}/{task.subtasks.length})
      </h4>
      <div className="space-y-1">
        {task.subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-2 text-sm">
            <Checkbox checked={subtask.status === 'DONE'} disabled />
            <span className={subtask.status === 'DONE' ? 'text-muted-foreground line-through' : ''}>
              {subtask.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
