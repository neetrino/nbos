'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  QUICK_CREATE_TASK_HEADER_ICONS_CLASS,
  QUICK_CREATE_TASK_TITLE_ROW_CLASS,
  TASK_PRIORITY_FLAME_BUTTON_ACTIVE_CLASS,
  TASK_PRIORITY_FLAME_BUTTON_CLASS,
  TASK_SHEET_PRIORITY_FLAME_ICON_SIZE,
} from '@/components/shared/quick-create-task/quick-create-task-constants';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isTaskUrgentPriority } from '../constants/tasks';
import type { TaskGeneralDraft } from '../task-general-form-state';
import { TaskSheetMoreActionsMenu } from './TaskSheetMoreActionsMenu';
import type { TaskWorkflowFooterAction } from './task-workflow-optimistic';

interface TaskSheetHeaderProps {
  draft: TaskGeneralDraft;
  disabled?: boolean;
  onPatchDraft: (partial: Partial<TaskGeneralDraft>) => void;
  onToggleUrgent: () => void;
  /** When set, shows settings-style ⋯ menu in the top-right. */
  moreActions?: {
    taskStatus: string;
    workflowSaving: boolean;
    onTaskAction: (action: TaskWorkflowFooterAction) => void;
    canDeleteDraft: boolean;
    canMoveToTrash: boolean;
    onDelete: () => void;
    onMoveToTrash: () => void;
  } | null;
}

export function TaskSheetHeader({
  draft,
  disabled = false,
  onPatchDraft,
  onToggleUrgent,
  moreActions = null,
}: TaskSheetHeaderProps) {
  const urgent = isTaskUrgentPriority(draft.priority);
  const [editing, setEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(draft.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const startEditing = () => {
    if (disabled) return;
    setTitleValue(draft.title);
    setEditing(true);
  };

  const commitTitle = () => {
    const next = titleValue.trim();
    if (next !== draft.title) onPatchDraft({ title: next || draft.title });
    setEditing(false);
  };

  const handleTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitTitle();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setTitleValue(draft.title);
      setEditing(false);
    }
  };

  const displayTitle = draft.title.trim() || 'Untitled task';

  return (
    <header>
      <div
        className={cn(
          QUICK_CREATE_TASK_TITLE_ROW_CLASS,
          moreActions && '-mr-7 pr-[6.5rem] sm:-mr-7 sm:pr-[7rem]',
        )}
      >
        {editing && !disabled ? (
          <input
            ref={inputRef}
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={handleTitleKeyDown}
            placeholder="Task title…"
            aria-label="Task title"
            className="border-primary text-foreground placeholder:text-muted-foreground/55 w-full border-0 border-b-2 bg-transparent py-0 text-2xl leading-snug font-bold tracking-tight outline-none sm:text-[1.65rem]"
          />
        ) : (
          <h2
            onClick={startEditing}
            className={cn(
              'text-foreground -mx-1 min-w-0 truncate rounded px-1 text-2xl leading-snug font-bold tracking-tight sm:text-[1.65rem]',
              disabled
                ? 'cursor-default opacity-60'
                : 'cursor-text transition-colors hover:bg-stone-100 dark:hover:bg-stone-800',
            )}
            title={disabled ? displayTitle : 'Click to edit task title'}
          >
            {displayTitle}
          </h2>
        )}
        <div
          className={cn(QUICK_CREATE_TASK_HEADER_ICONS_CLASS, moreActions && 'right-0 sm:right-0')}
        >
          <button
            type="button"
            className={cn(
              TASK_PRIORITY_FLAME_BUTTON_CLASS,
              'hover:text-orange-600',
              urgent && TASK_PRIORITY_FLAME_BUTTON_ACTIVE_CLASS,
            )}
            aria-pressed={urgent}
            aria-label={urgent ? 'Urgent' : 'Mark as urgent'}
            title={urgent ? 'Urgent' : 'Mark as urgent'}
            disabled={disabled}
            onClick={onToggleUrgent}
          >
            <Flame size={TASK_SHEET_PRIORITY_FLAME_ICON_SIZE} strokeWidth={1.75} aria-hidden />
          </button>
          {moreActions ? (
            <TaskSheetMoreActionsMenu
              taskStatus={moreActions.taskStatus}
              workflowSaving={moreActions.workflowSaving}
              onTaskAction={moreActions.onTaskAction}
              canDeleteDraft={moreActions.canDeleteDraft}
              canMoveToTrash={moreActions.canMoveToTrash}
              onDelete={moreActions.onDelete}
              onMoveToTrash={moreActions.onMoveToTrash}
              disabled={disabled}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}
