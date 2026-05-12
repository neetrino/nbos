'use client';

import { Loader2 } from 'lucide-react';
import { EntitySheetFloatingRail } from '@/components/shared/entity-sheet-floating-rail';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DetailSheetFormFooter, StatusBadge } from '@/components/shared';
import { buildTaskCompletionBlockers } from '../utils/task-completion-readiness';
import type { Task } from '@/lib/api/tasks';
import { getTaskPriority, getTaskStatus } from '../constants/tasks';
import { TaskActionButtons } from './TaskActionButtons';
import { TaskChatPlaceholder } from './TaskChatPlaceholder';
import { TaskChecklistSection } from './TaskChecklistSection';
import { TaskCompletionRulesPanel } from './TaskCompletionRulesPanel';
import { TaskDatesSection, TaskLinksSection, TaskPeopleSection } from './TaskDetailsSections';
import { TaskSubtasksSection } from './TaskSubtasksSection';
import { TaskSheetGeneralSection } from './TaskSheetGeneralSection';
import { TaskSummaryCard } from './TaskSheetSummaryCard';
import { useTaskSheetState } from './use-task-sheet-state';

interface TaskSheetProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (task: Task) => void;
}

const TASK_SHEET_WIDTH_CLASS =
  'flex w-full flex-col p-0 data-[side=right]:w-full sm:max-w-none sm:data-[side=right]:w-[76vw] 2xl:data-[side=right]:w-[82vw]';

const TASK_SHEET_RAIL_ANCHOR_CLASS = 'sm:right-[76vw] 2xl:right-[82vw]';

export function TaskSheet({ taskId, open, onOpenChange, onUpdate }: TaskSheetProps) {
  const state = useTaskSheetState({ taskId, open, onUpdate });

  if (!state.task && !state.loading && !state.generalError) return null;

  const status = state.task ? getTaskStatus(state.task.status) : null;
  const priority = state.task ? getTaskPriority(state.task.priority) : null;
  const blockers = state.task ? buildTaskCompletionBlockers(state.task) : [];
  const readyForCompletion = state.task ? blockers.length === 0 : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        floatingClose
        floatingRailVisible={open}
        floatingRailAnchorClassName={TASK_SHEET_RAIL_ANCHOR_CLASS}
        floatingRail={
          state.task ? (
            <EntitySheetFloatingRail
              sourcePageHref={`/tasks?openTaskId=${encodeURIComponent(state.task.id)}`}
              workspaceHref={
                state.task.workspaceId ? `/work-spaces/${state.task.workspaceId}` : null
              }
            />
          ) : undefined
        }
        className={TASK_SHEET_WIDTH_CLASS}
      >
        <SheetHeader className="border-border border-b px-6 py-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {status && <StatusBadge label={status.label} variant={status.variant} />}
                {priority && <StatusBadge label={priority.label} variant={priority.variant} />}
                {state.task && <Badge variant="outline">{state.task.code}</Badge>}
                {state.task && (
                  <StatusBadge
                    label={readyForCompletion ? 'Ready' : 'Blocked'}
                    variant={readyForCompletion ? 'green' : 'red'}
                  />
                )}
              </div>
              <SheetTitle className="text-xl leading-tight">
                {state.loading ? 'Loading task...' : state.generalDraft?.title || state.task?.title}
              </SheetTitle>
            </div>
            {state.task && (
              <TaskActionButtons
                task={state.task}
                disabled={state.saving}
                onAction={state.handleAction}
              />
            )}
          </div>
        </SheetHeader>

        {state.loading && !state.task ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        ) : state.task && state.generalDraft ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-5 px-6 py-5">
                  {state.generalError && (
                    <div className="border-destructive/25 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
                      {state.generalError}
                    </div>
                  )}

                  <TaskSummaryCard task={state.task} />

                  <TaskSheetGeneralSection
                    draft={state.generalDraft}
                    saving={state.saving}
                    onPatchDraft={state.patchGeneralDraft}
                    onSearchEmployees={state.searchEmployees}
                  />

                  <div className="grid gap-4 lg:grid-cols-2">
                    <section className="border-border bg-card rounded-lg border p-4">
                      <TaskPeopleSection task={state.task} />
                    </section>
                    <section className="border-border bg-card rounded-lg border p-4">
                      <TaskDatesSection task={state.task} />
                    </section>
                  </div>

                  <section className="border-border bg-card rounded-lg border p-4">
                    <TaskCompletionRulesPanel
                      task={state.task}
                      serverBlockers={state.completionBlockers}
                    />
                  </section>

                  <section className="border-border bg-card rounded-lg border p-4">
                    <TaskLinksSection task={state.task} onRemoveLink={state.handleRemoveLink} />
                  </section>

                  {state.task.subtasks.length > 0 && (
                    <section className="border-border bg-card rounded-lg border p-4">
                      <TaskSubtasksSection task={state.task} />
                    </section>
                  )}

                  <Separator />

                  <TaskChecklistSection
                    task={state.task}
                    newChecklistTitle={state.newChecklistTitle}
                    newItemTexts={state.newItemTexts}
                    onNewChecklistTitleChange={state.setNewChecklistTitle}
                    onNewItemTextChange={(checklistId, value) =>
                      state.setNewItemTexts((prev) => ({ ...prev, [checklistId]: value }))
                    }
                    onAddChecklist={state.handleAddChecklist}
                    onAddItem={state.handleAddItem}
                    onToggleItem={state.handleToggleItem}
                    onDeleteChecklist={state.handleDeleteChecklist}
                    onDeleteItem={state.handleDeleteItem}
                  />
                </div>
              </ScrollArea>

              <TaskChatPlaceholder
                task={state.task}
                messages={state.taskMessages}
                onSend={state.handleSendMessage}
              />
            </div>

            <DetailSheetFormFooter
              visible
              dirty={state.generalDirty}
              saving={state.saving}
              errorMessage={state.generalError}
              onSave={() => void state.handleGeneralSave()}
              onCancel={state.handleGeneralCancel}
            />
          </>
        ) : (
          <div className="text-muted-foreground p-5 text-sm">{state.generalError}</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
