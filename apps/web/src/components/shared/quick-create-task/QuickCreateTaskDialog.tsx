'use client';

import { Calendar, Flame, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NbosDatePicker } from '@/components/shared/date-picker';
import { usePermission } from '@/lib/permissions';
import {
  QUICK_CREATE_TASK_BODY_CLASS,
  QUICK_CREATE_TASK_DIALOG_CLASS,
  QUICK_CREATE_TASK_GHOST_INPUT_CLASS,
  QUICK_CREATE_TASK_HEADER_ICONS_CLASS,
  QUICK_CREATE_TASK_TITLE_ROW_CLASS,
  QUICK_CREATE_TASK_ROW_LABEL_CLASS,
  QUICK_CREATE_TASK_TITLE_INPUT_CLASS,
  QUICK_CREATE_TASK_DESCRIPTION_INPUT_CLASS,
  TASK_PRIORITY_FLAME_BUTTON_ACTIVE_CLASS,
  TASK_PRIORITY_FLAME_BUTTON_CLASS,
  TASK_PRIORITY_FLAME_ICON_SIZE,
} from './quick-create-task-constants';
import {
  QuickCreateTaskAutoGrowTextarea,
  QUICK_CREATE_TASK_TITLE_MIN_HEIGHT_PX,
} from './QuickCreateTaskAutoGrowTextarea';
import { QuickCreateTaskAssigneePicker } from './QuickCreateTaskAssigneePicker';
import {
  useQuickCreateTaskForm,
  type QuickCreateTaskDialogProps,
} from './use-quick-create-task-form';

export type { QuickCreateTaskDialogProps };

export function QuickCreateTaskDialog(props: QuickCreateTaskDialogProps) {
  const { me } = usePermission();
  const { onOpenFull, open, onOpenChange } = props;
  const form = useQuickCreateTaskForm({ ...props, me });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={QUICK_CREATE_TASK_DIALOG_CLASS}
        forceNestedBackdrop={props.forceNestedBackdrop}
      >
        <DialogTitle className="sr-only">Create task</DialogTitle>

        <form
          className={QUICK_CREATE_TASK_BODY_CLASS}
          autoComplete="off"
          onSubmit={(event) => event.preventDefault()}
        >
          {form.creatorBlocked ? (
            <p className="text-destructive mb-3 text-sm" role="alert">
              Your account is not linked to an employee record, so tasks cannot be created.
            </p>
          ) : null}

          <div className={QUICK_CREATE_TASK_TITLE_ROW_CLASS}>
            <QuickCreateTaskAutoGrowTextarea
              id="quick-task-title"
              name="quick-create-task-title"
              value={form.title}
              onChange={(event) => form.setTitle(event.target.value)}
              placeholder="Task name"
              autoFocus
              disabled={form.saving || form.creatorBlocked}
              minHeightPx={QUICK_CREATE_TASK_TITLE_MIN_HEIGHT_PX}
              className={QUICK_CREATE_TASK_TITLE_INPUT_CLASS}
              onSubmitShortcut={() => void form.handleCreate()}
            />
            <div className={QUICK_CREATE_TASK_HEADER_ICONS_CLASS}>
              <Button
                type="button"
                variant="ghost"
                className={cn(
                  TASK_PRIORITY_FLAME_BUTTON_CLASS,
                  'hover:text-orange-600',
                  form.isHighPriority && TASK_PRIORITY_FLAME_BUTTON_ACTIVE_CLASS,
                )}
                aria-pressed={form.isHighPriority}
                aria-label={form.isHighPriority ? 'Urgent' : 'Mark as urgent'}
                title={form.isHighPriority ? 'Urgent' : 'Mark as urgent'}
                disabled={form.saving}
                onClick={() => form.setIsHighPriority((value) => !value)}
              >
                <Flame size={TASK_PRIORITY_FLAME_ICON_SIZE} strokeWidth={1.75} aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground/75 size-8 rounded-full"
                aria-label="Close"
                disabled={form.saving}
                onClick={() => onOpenChange(false)}
              >
                <X size={19} strokeWidth={1.75} aria-hidden />
              </Button>
            </div>
          </div>

          <div className="w-full min-w-0">
            <QuickCreateTaskAutoGrowTextarea
              id="quick-task-description"
              name="quick-create-task-description"
              value={form.description}
              onChange={(event) => form.setDescription(event.target.value)}
              placeholder="Description"
              disabled={form.saving || form.creatorBlocked}
              className={QUICK_CREATE_TASK_DESCRIPTION_INPUT_CLASS}
              onSubmitShortcut={() => void form.handleCreate()}
            />
          </div>

          <div className="border-border/70 mt-3 space-y-2 border-t pt-3">
            <div className="flex min-h-9 items-center gap-3">
              <span className={QUICK_CREATE_TASK_ROW_LABEL_CLASS}>Assignee</span>
              <QuickCreateTaskAssigneePicker
                assigneeId={form.assigneeId}
                assigneeLabel={form.assigneeLabel}
                assigneeAvatar={form.assigneeAvatar}
                disabled={form.saving || form.creatorBlocked}
                onSearch={form.searchEmployees}
                onSelect={form.selectAssignee}
              />
            </div>

            <div className="flex min-h-9 items-center gap-3">
              <span className={QUICK_CREATE_TASK_ROW_LABEL_CLASS}>Due date</span>
              <div className="relative flex min-w-0 flex-1 items-center gap-2">
                <Calendar size={16} className="text-primary shrink-0" aria-hidden />
                <NbosDatePicker
                  id="quick-task-due"
                  value={form.dueDate}
                  onChange={form.setDueDate}
                  variant="extended"
                  disabled={form.saving || form.creatorBlocked}
                  clearable
                  embedded
                  className="min-w-0 flex-1"
                  aria-label="Due date"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="border-border/70 flex flex-wrap items-center justify-between gap-3 border-t px-3 py-3 sm:px-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-lg px-5"
              onClick={() => void form.handleCreate()}
              disabled={form.saving || !form.canCreate}
            >
              {form.saving ? 'Creating…' : 'Create'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-foreground h-9 px-2"
              onClick={() => onOpenChange(false)}
              disabled={form.saving}
            >
              Cancel
            </Button>
          </div>
          {onOpenFull ? (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="text-muted-foreground h-9 px-0 text-sm font-normal"
              onClick={onOpenFull}
            >
              Full form
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
