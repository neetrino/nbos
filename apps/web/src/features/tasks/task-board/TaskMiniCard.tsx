'use client';

import { useState, type MouseEvent, type ReactNode } from 'react';
import { CheckCircle2, Play, RotateCcw } from 'lucide-react';
import { KanbanCardShell } from '@/components/shared';
import { TaskUrgentFlameIndicator } from '@/features/tasks/components/TaskUrgentFlameIndicator';
import { TaskCardPeoplePair } from './TaskCardPeoplePair';
import { cn } from '@/lib/utils';
import type { Task } from '@/lib/api/tasks';
import { TASK_CARD_COMPLETE_FLASH_CLASS } from './task-card-complete-flash';
import { getDeadlineColumn } from './task-board-constants';
import { TaskCardDueDatePicker } from './TaskCardDueDatePicker';
import {
  formatTaskCardDate,
  pickTaskCardContextChips,
  TASK_CARD_ACTION_BTN_CLASS,
  TASK_CARD_CHIP_CLASS,
  TASK_CARD_DUE_BADGE_CLASS,
  TASK_CARD_DUE_BADGE_TONE_CLASS,
  TASK_CARD_HOVER_ACTIONS_CLASS,
  taskCardContextChipClass,
  taskCardContextIcon,
} from './task-mini-card-meta';

export type TaskBoardAction = 'start' | 'complete' | 'reopen';

export function TaskMiniCard({
  task,
  onAction,
  onClick,
  onDueDateChange,
  /** When true, omit Work Space chip (page already is that work space). */
  hideWorkspaceContext = false,
}: {
  task: Task;
  onAction: (taskId: string, action: TaskBoardAction) => void | Promise<void>;
  onClick: (task: Task) => void;
  onDueDateChange?: (taskId: string, dueDate: string) => void | Promise<void>;
  hideWorkspaceContext?: boolean;
}) {
  const contextChips = pickTaskCardContextChips(task, {
    hideWorkspace: hideWorkspaceContext,
  });
  const canStart = task.status === 'OPEN' || task.status === 'NEW';
  const canReopen =
    task.status === 'COMPLETED' || task.status === 'DONE' || task.status === 'ON_HOLD';
  const canComplete = !canReopen;
  const isOverdue = task.dueDate ? getDeadlineColumn(task) === 'overdue' : false;
  const [isCompleting, setIsCompleting] = useState(false);

  const runAction = async (action: TaskBoardAction, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isCompleting) return;
    if (action === 'complete') setIsCompleting(true);
    try {
      await Promise.resolve(onAction(task.id, action));
    } finally {
      if (action === 'complete') setIsCompleting(false);
    }
  };

  return (
    <KanbanCardShell
      preset="neutral"
      radius="xl"
      padding="lg"
      baseShadow="sm"
      hoverShadow="md"
      transition="all"
      className={cn(
        'group w-full min-w-0 cursor-pointer pb-2',
        isCompleting && TASK_CARD_COMPLETE_FLASH_CLASS,
      )}
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

      {task.dueDate ? (
        onDueDateChange ? (
          <TaskCardDueDatePicker
            dueDate={task.dueDate}
            isOverdue={isOverdue}
            onChange={(dueDate) => onDueDateChange(task.id, dueDate)}
          />
        ) : (
          <span
            className={cn(
              TASK_CARD_DUE_BADGE_CLASS,
              'mt-2',
              isOverdue
                ? TASK_CARD_DUE_BADGE_TONE_CLASS.overdue
                : TASK_CARD_DUE_BADGE_TONE_CLASS.default,
            )}
          >
            {formatTaskCardDate(task.dueDate)}
          </span>
        )
      ) : null}

      {contextChips.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {contextChips.map((chip) => {
            const ChipIcon = taskCardContextIcon(chip);
            return (
              <span
                key={chip.key}
                className={cn(
                  TASK_CARD_CHIP_CLASS,
                  taskCardContextChipClass(chip.kind, chip.entityType),
                )}
                title={chip.label}
              >
                <ChipIcon size={11} className="shrink-0 opacity-80" aria-hidden />
                <span className="truncate">{chip.label}</span>
              </span>
            );
          })}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2">
        <TaskCardPeoplePair creator={task.creator} assignee={task.assignee} />

        <div className={TASK_CARD_HOVER_ACTIONS_CLASS}>
          {canStart ? (
            <QuickActionButton
              label="Start task"
              className="bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-950/60"
              onClick={(event) => {
                void runAction('start', event);
              }}
            >
              <Play size={14} className="ml-0.5" aria-hidden />
            </QuickActionButton>
          ) : null}
          {canComplete ? (
            <QuickActionButton
              label="Finish task"
              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
              onClick={(event) => {
                void runAction('complete', event);
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
                void runAction('reopen', event);
              }}
            >
              <RotateCcw size={13} aria-hidden />
            </QuickActionButton>
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
