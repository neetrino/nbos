'use client';

import { CheckCircle2, MoreHorizontal, Pause, Play, RotateCcw, Trash2 } from 'lucide-react';
import { DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE } from '@/components/shared/detail-sheet-classes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  canDeleteDraft: boolean;
  onDelete: () => void;
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
  canDeleteDraft,
  onDelete,
}: TaskSheetStickyFooterProps) {
  const effectiveStatus = workflowFooterStatus ?? taskStatus;
  const showSaveBar = (dirty || Boolean(errorMessage)) && workflowFooterStatus == null;

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
        canDeleteDraft={canDeleteDraft}
        onDelete={onDelete}
      />
    </div>
  );
}

interface TaskSheetWorkflowActionsProps {
  taskStatus: string;
  workflowSaving: boolean;
  onTaskAction: (action: TaskWorkflowFooterAction) => void;
  canDeleteDraft: boolean;
  onDelete: () => void;
}

function TaskSheetWorkflowActions({
  taskStatus,
  workflowSaving,
  onTaskAction,
  canDeleteDraft,
  onDelete,
}: TaskSheetWorkflowActionsProps) {
  const mode = resolveTaskWorkflowFooterMode(taskStatus);
  const canHold = ['IN_PROGRESS', 'REVIEW'].includes(taskStatus);
  const canReopen = ['COMPLETED', 'DONE', 'ON_HOLD'].includes(taskStatus);
  const canApproveReview = taskStatus === 'REVIEW';
  const canRequestReviewChanges = taskStatus === 'REVIEW';

  return (
    <div className="flex items-center gap-4">
      {mode === 'start-and-complete' ? (
        <Button
          type="button"
          size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
          onClick={() => onTaskAction('start')}
        >
          <Play size={14} /> Start
        </Button>
      ) : null}
      {mode === 'start-and-complete' || mode === 'complete-only' ? (
        <Button
          type="button"
          variant={mode === 'complete-only' ? 'success' : 'outline'}
          size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
          onClick={() => onTaskAction('complete')}
        >
          <CheckCircle2 size={14} /> Complete
        </Button>
      ) : null}
      {mode === 'resume-only' ? (
        <Button
          type="button"
          variant="secondary"
          size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
          onClick={() => onTaskAction('reopen')}
        >
          <RotateCcw size={14} /> Resume
        </Button>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <Button
              {...props}
              type="button"
              variant="outline"
              size="icon-lg"
              className="size-10 min-h-10 min-w-10"
              disabled={workflowSaving}
              aria-label="More task actions"
            >
              <MoreHorizontal size={16} />
            </Button>
          )}
        />
        <DropdownMenuContent align="start" className="min-w-[12rem]">
          <DropdownMenuItem
            disabled={!canApproveReview || workflowSaving}
            onClick={() => onTaskAction('approveReview')}
          >
            Approve review
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canRequestReviewChanges || workflowSaving}
            onClick={() => onTaskAction('requestReviewChanges')}
          >
            Request changes
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canHold || workflowSaving}
            onClick={() => onTaskAction('hold')}
          >
            <Pause size={14} /> Put On Hold
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canReopen || workflowSaving}
            onClick={() => onTaskAction('reopen')}
          >
            <RotateCcw size={14} /> Reopen
          </DropdownMenuItem>
          {canDeleteDraft ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" disabled={workflowSaving} onClick={onDelete}>
                <Trash2 size={14} /> Delete draft
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
