'use client';

import type { MouseEvent, ReactNode } from 'react';
import { CheckCircle2, Play, RotateCcw } from 'lucide-react';
import { KanbanCardShell } from '@/components/shared';
import { TaskUrgentFlameIndicator } from '@/features/tasks/components/TaskUrgentFlameIndicator';
import { cn } from '@/lib/utils';
import type { Task } from '@/lib/api/tasks';
import { getDeadlineColumn } from './task-board-constants';
import {
  formatAssigneeShortName,
  formatTaskCardDate,
  linkChipIcon,
  pickTaskCardLinkChips,
  TASK_CARD_ACTION_BTN_CLASS,
  TASK_CARD_CHIP_CLASS,
} from './task-mini-card-meta';

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
  const linkChips = pickTaskCardLinkChips(task.links);
  const canStart = task.status === 'OPEN' || task.status === 'NEW';
  const canComplete = task.status === 'IN_PROGRESS';
  const canReopen =
    task.status === 'COMPLETED' || task.status === 'DONE' || task.status === 'ON_HOLD';
  const isOverdue = task.dueDate ? getDeadlineColumn(task) === 'overdue' : false;

  const assigneeLabel = task.assignee
    ? formatAssigneeShortName(task.assignee.firstName, task.assignee.lastName)
    : 'Unassigned';
  const assigneeInitials = task.assignee
    ? `${task.assignee.firstName.charAt(0)}${task.assignee.lastName.charAt(0)}`.toUpperCase()
    : '?';

  return (
    <KanbanCardShell
      preset="neutral"
      radius="xl"
      padding="lg"
      baseShadow="sm"
      hoverShadow="md"
      transition="all"
      className="group w-full min-w-0 cursor-pointer"
      onClick={() => onClick(task)}
    >
      <div className="flex items-start gap-2">
        <p
          className="text-foreground min-w-0 flex-1 text-sm leading-snug font-semibold"
          title={task.title}
        >
          {task.title}
        </p>
        <TaskUrgentFlameIndicator priority={task.priority} className="mt-0.5 shrink-0" />
      </div>

      {linkChips.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {linkChips.map((link) => {
            const ChipIcon = linkChipIcon(link.entityType);
            const label = link.entityLabel ?? link.entityType;
            return (
              <span key={link.id} className={TASK_CARD_CHIP_CLASS} title={label}>
                <ChipIcon size={12} className="shrink-0 opacity-70" aria-hidden />
                <span className="truncate">{label}</span>
              </span>
            );
          })}
        </div>
      ) : null}

      <div className="border-border/60 mt-3 flex items-center justify-between gap-2 border-t pt-3">
        <div className="flex min-w-0 items-center">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
            title={assigneeLabel}
            aria-label={assigneeLabel}
          >
            {assigneeInitials}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canStart ? (
            <QuickActionButton
              label="Start task"
              className="bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-950/60"
              onClick={(event) => {
                event.stopPropagation();
                onAction(task.id, 'start');
              }}
            >
              <Play size={14} className="ml-0.5" aria-hidden />
            </QuickActionButton>
          ) : null}
          {canComplete ? (
            <QuickActionButton
              label="Complete task"
              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
              onClick={(event) => {
                event.stopPropagation();
                onAction(task.id, 'complete');
              }}
            >
              <CheckCircle2 size={14} aria-hidden />
            </QuickActionButton>
          ) : null}
          {canReopen ? (
            <QuickActionButton
              label="Reopen task"
              className="bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400"
              onClick={(event) => {
                event.stopPropagation();
                onAction(task.id, 'reopen');
              }}
            >
              <RotateCcw size={13} aria-hidden />
            </QuickActionButton>
          ) : null}
          {task.dueDate ? (
            <span
              className={cn(
                'text-xs tabular-nums',
                isOverdue
                  ? 'font-bold text-red-600 dark:text-red-400'
                  : 'text-muted-foreground font-semibold',
              )}
            >
              {formatTaskCardDate(task.dueDate)}
            </span>
          ) : null}
        </div>
      </div>
    </KanbanCardShell>
  );
}

function QuickActionButton({
  label,
  className,
  onClick,
  children,
}: {
  label: string;
  className: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(TASK_CARD_ACTION_BTN_CLASS, className)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
