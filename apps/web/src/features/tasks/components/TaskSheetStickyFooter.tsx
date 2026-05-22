'use client';

import { CheckCircle2, MoreHorizontal, Pause, Play, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type TaskFooterAction =
  | 'start'
  | 'complete'
  | 'reopen'
  | 'hold'
  | 'approveReview'
  | 'requestReviewChanges';

interface TaskSheetStickyFooterProps {
  dirty: boolean;
  /** Blocks workflow actions (start, complete, …) while a server transition runs. */
  workflowSaving: boolean;
  errorMessage?: string | null;
  taskStatus: string;
  onSave: () => void;
  onSaveAndClose: () => void;
  onCancel: () => void;
  onTaskAction: (action: TaskFooterAction) => void;
  onDelete: () => void;
}

export function TaskSheetStickyFooter({
  dirty,
  workflowSaving,
  errorMessage,
  taskStatus,
  onSave,
  onSaveAndClose,
  onCancel,
  onTaskAction,
  onDelete,
}: TaskSheetStickyFooterProps) {
  const canStart = ['NEW', 'OPEN', 'ON_HOLD'].includes(taskStatus);
  const canComplete = ['IN_PROGRESS', 'REVIEW'].includes(taskStatus);
  const canHold = ['IN_PROGRESS', 'REVIEW'].includes(taskStatus);
  const canReopen = ['COMPLETED', 'DONE', 'ON_HOLD'].includes(taskStatus);
  const canApproveReview = taskStatus === 'REVIEW';
  const canRequestReviewChanges = taskStatus === 'REVIEW';

  return (
    <div className="border-border/50 bg-background/95 supports-[backdrop-filter]:bg-background/85 sticky bottom-0 z-20 shrink-0 border-t px-6 py-3 backdrop-blur-sm">
      <div className="flex flex-col gap-3">
        {(dirty || errorMessage) && (
          <div className="flex flex-col gap-3">
            {errorMessage ? (
              <p className="text-destructive text-sm" role="alert">
                {errorMessage}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" disabled={!dirty} onClick={onSave}>
                Save
              </Button>
              <Button type="button" variant="secondary" onClick={onSaveAndClose}>
                Save & Close
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 border-t pt-3">
          <Button
            type="button"
            disabled={!canStart || workflowSaving}
            onClick={() => onTaskAction('start')}
          >
            <Play size={14} /> Start
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!canComplete || workflowSaving}
            onClick={() => onTaskAction('complete')}
          >
            <CheckCircle2 size={14} /> Complete
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={(props) => (
                <Button
                  {...props}
                  type="button"
                  variant="outline"
                  size="icon"
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
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" disabled={workflowSaving} onClick={onDelete}>
                <Trash2 size={14} /> Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
