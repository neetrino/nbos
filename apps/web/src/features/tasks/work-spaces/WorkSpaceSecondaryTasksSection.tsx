'use client';

import { StatusBadge } from '@/components/shared';
import { TaskMiniCard, type TaskBoardAction } from '@/features/tasks/task-board';
import type { Task } from '@/lib/api/tasks';

export function WorkSpaceSecondaryTasksSection({
  deferred,
  cancelled,
  onAction,
  onOpenTask,
}: {
  deferred: Task[];
  cancelled: Task[];
  onAction: (taskId: string, action: TaskBoardAction) => void;
  onOpenTask: (task: Task) => void;
}) {
  if (deferred.length === 0 && cancelled.length === 0) return null;

  return (
    <div className="border-border bg-muted/20 space-y-4 rounded-xl border p-4">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Deferred and cancelled
      </p>
      <div className="flex flex-wrap gap-6">
        {deferred.length > 0 && (
          <section className="min-w-[200px] flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge label="Deferred" variant="amber" />
              <span className="text-muted-foreground text-xs">{deferred.length}</span>
            </div>
            <div className="space-y-2">
              {deferred.map((task) => (
                <TaskMiniCard key={task.id} task={task} onAction={onAction} onClick={onOpenTask} />
              ))}
            </div>
          </section>
        )}
        {cancelled.length > 0 && (
          <section className="min-w-[200px] flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge label="Cancelled" variant="red" />
              <span className="text-muted-foreground text-xs">{cancelled.length}</span>
            </div>
            <div className="space-y-2">
              {cancelled.map((task) => (
                <TaskMiniCard key={task.id} task={task} onAction={onAction} onClick={onOpenTask} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
