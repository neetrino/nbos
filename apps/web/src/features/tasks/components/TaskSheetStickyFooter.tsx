'use client';

import { CheckCircle2, Play, RotateCcw, Undo2 } from 'lucide-react';
import { DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE } from '@/components/shared/detail-sheet-classes';
import { Button } from '@/components/ui/button';
import { resolveTaskWorkflowFooterMode } from './task-sheet-workflow-footer';
import type { TaskWorkflowFooterAction } from './task-workflow-optimistic';

interface TaskSheetStickyFooterProps {
  dirty: boolean;
  /** Blocks workflow actions (start, complete, …) while a server transition runs. */
  workflowSaving: boolean;
  /** Optimistic status for instant footer transitions (overrides taskStatus). */
  workflowFooterStatus?: string | null;
  errorMessage?: string | null;
  taskStatus: string;
  onSave: () => void;
  onCancel: () => void;
  onTaskAction: (action: TaskWorkflowFooterAction) => void;
  isTrashed: boolean;
  onRestore?: () => void;
}

const FOOTER_SHELL_CLASS =
  'border-border/50 bg-background/95 supports-[backdrop-filter]:bg-background/85 sticky bottom-0 z-20 shrink-0 border-t px-6 py-3 backdrop-blur-sm';

export function TaskSheetStickyFooter({
  dirty,
  workflowSaving,
  workflowFooterStatus,
  errorMessage,
  taskStatus,
  onSave,
  onCancel,
  onTaskAction,
  isTrashed,
  onRestore,
}: TaskSheetStickyFooterProps) {
  const effectiveStatus = workflowFooterStatus ?? taskStatus;
  const showSaveBar =
    !isTrashed && (dirty || Boolean(errorMessage)) && workflowFooterStatus == null;

  if (isTrashed && onRestore) {
    return (
      <div className={FOOTER_SHELL_CLASS}>
        <div className="flex justify-center">
          <Button type="button" size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE} onClick={onRestore}>
            <Undo2 size={14} aria-hidden />
            Restore
          </Button>
        </div>
      </div>
    );
  }

  if (showSaveBar) {
    return (
      <div className={FOOTER_SHELL_CLASS}>
        <div className="flex flex-col items-center gap-3">
          {errorMessage ? (
            <p className="text-destructive max-w-lg text-center text-sm" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              type="button"
              size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
              disabled={!dirty}
              onClick={onSave}
            >
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={FOOTER_SHELL_CLASS}>
      <TaskSheetWorkflowActions
        taskStatus={effectiveStatus}
        workflowSaving={workflowSaving}
        onTaskAction={onTaskAction}
      />
    </div>
  );
}

interface TaskSheetWorkflowActionsProps {
  taskStatus: string;
  workflowSaving: boolean;
  onTaskAction: (action: TaskWorkflowFooterAction) => void;
}

function TaskSheetWorkflowActions({
  taskStatus,
  workflowSaving,
  onTaskAction,
}: TaskSheetWorkflowActionsProps) {
  const mode = resolveTaskWorkflowFooterMode(taskStatus);

  return (
    <div className="flex items-center justify-center gap-4">
      {mode === 'start-and-complete' ? (
        <Button
          type="button"
          size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
          disabled={workflowSaving}
          onClick={() => onTaskAction('start')}
        >
          <Play size={14} aria-hidden /> Start
        </Button>
      ) : null}
      {mode === 'start-and-complete' || mode === 'complete-only' ? (
        <Button
          type="button"
          variant={mode === 'complete-only' ? 'success' : 'outline'}
          size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
          disabled={workflowSaving}
          onClick={() => onTaskAction('complete')}
        >
          <CheckCircle2 size={14} aria-hidden /> Complete
        </Button>
      ) : null}
      {mode === 'resume-only' ? (
        <Button
          type="button"
          variant="secondary"
          size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
          disabled={workflowSaving}
          onClick={() => onTaskAction('reopen')}
        >
          <RotateCcw size={14} aria-hidden /> Resume
        </Button>
      ) : null}
    </div>
  );
}
