'use client';

import { CheckSquare, Flag, FolderKanban, Play, CheckCircle2, RotateCcw } from 'lucide-react';
import { getTaskPriority } from '@/features/tasks/constants/tasks';
import type { Task } from '@/lib/api/tasks';
import { getDeadlineColumn } from './task-board-constants';

export type TaskBoardAction = 'start' | 'complete' | 'reopen';

export function TaskMiniCard({
  task,
  onAction,
  onClick,
}: {
  task: Task;
  onAction: (taskId: string, action: TaskBoardAction) => void;
  onClick: (task: Task) => void;
}) {
  const priority = getTaskPriority(task.priority);
  const checklistTotal = task.checklists.reduce((sum, cl) => sum + cl.items.length, 0);
  const checklistDone = task.checklists.reduce(
    (sum, cl) => sum + cl.items.filter((i) => i.checked).length,
    0,
  );

  const canStart = task.status === 'OPEN' || task.status === 'NEW';

  return (
    <div
      className="border-border bg-card space-y-2 rounded-xl border p-3 transition-shadow hover:shadow-md"
      onClick={() => onClick(task)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm leading-tight font-medium">{task.title}</p>
        {priority && <Flag size={12} className={priority.color} />}
      </div>

      {task.links.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.links.map((link) => (
            <span
              key={link.id}
              className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]"
            >
              <FolderKanban size={9} />
              {link.entityType}
            </span>
          ))}
        </div>
      )}

      {checklistTotal > 0 && (
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <CheckSquare size={10} />
          {checklistDone}/{checklistTotal}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {task.assignee && (
            <div className="bg-accent/20 text-accent flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold">
              {task.assignee.firstName[0]}
              {task.assignee.lastName[0]}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {canStart && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(task.id, 'start');
              }}
              className="hover:bg-muted rounded p-0.5"
              title="Start"
            >
              <Play size={12} className="text-blue-500" />
            </button>
          )}
          {task.status === 'IN_PROGRESS' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(task.id, 'complete');
              }}
              className="hover:bg-muted rounded p-0.5"
              title="Complete"
            >
              <CheckCircle2 size={12} className="text-green-500" />
            </button>
          )}
          {(task.status === 'COMPLETED' || task.status === 'DONE' || task.status === 'ON_HOLD') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(task.id, 'reopen');
              }}
              className="hover:bg-muted rounded p-0.5"
              title="Reopen"
            >
              <RotateCcw size={12} className="text-amber-500" />
            </button>
          )}

          {task.dueDate && (
            <span
              className={`text-[10px] ${getDeadlineColumn(task) === 'overdue' ? 'font-semibold text-red-500' : 'text-muted-foreground'}`}
            >
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {task._count.subtasks > 0 && (
        <div className="text-muted-foreground flex items-center gap-1 text-[10px]">
          Subtasks:{' '}
          {task.subtasks.filter((s) => s.status === 'COMPLETED' || s.status === 'DONE').length}/
          {task._count.subtasks}
        </div>
      )}
    </div>
  );
}
