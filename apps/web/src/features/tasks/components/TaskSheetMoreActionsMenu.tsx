'use client';

import { Pause, RotateCcw, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TaskWorkflowFooterAction } from './task-workflow-optimistic';

interface TaskSheetMoreActionsMenuProps {
  taskStatus: string;
  workflowSaving: boolean;
  onTaskAction: (action: TaskWorkflowFooterAction) => void;
  canDeleteDraft: boolean;
  canMoveToTrash: boolean;
  onDelete: () => void;
  onMoveToTrash: () => void;
  disabled?: boolean;
}

/** Header overflow menu — same outline icon trigger as page settings. */
export function TaskSheetMoreActionsMenu({
  taskStatus,
  workflowSaving,
  onTaskAction,
  canDeleteDraft,
  canMoveToTrash,
  onDelete,
  onMoveToTrash,
  disabled = false,
}: TaskSheetMoreActionsMenuProps) {
  const canHold = ['IN_PROGRESS', 'REVIEW'].includes(taskStatus);
  const canReopen = ['COMPLETED', 'DONE', 'ON_HOLD'].includes(taskStatus);
  const canApproveReview = taskStatus === 'REVIEW';
  const canRequestReviewChanges = taskStatus === 'REVIEW';
  const busy = disabled || workflowSaving;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={busy}
            aria-label="Task settings"
            title="Task settings"
            className={props.className}
          >
            <Settings className="size-4" aria-hidden />
          </Button>
        )}
      />
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        <DropdownMenuItem
          disabled={!canApproveReview || busy}
          onClick={() => onTaskAction('approveReview')}
        >
          Approve review
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!canRequestReviewChanges || busy}
          onClick={() => onTaskAction('requestReviewChanges')}
        >
          Request changes
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canHold || busy} onClick={() => onTaskAction('hold')}>
          <Pause size={14} aria-hidden /> Put On Hold
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canReopen || busy} onClick={() => onTaskAction('reopen')}>
          <RotateCcw size={14} aria-hidden /> Reopen
        </DropdownMenuItem>
        {canDeleteDraft ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={busy} onClick={onDelete}>
              <Trash2 size={14} aria-hidden /> Delete draft
            </DropdownMenuItem>
          </>
        ) : null}
        {canMoveToTrash ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={busy} onClick={onMoveToTrash}>
              <Trash2 size={14} aria-hidden /> Move to Trash
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
