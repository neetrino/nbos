'use client';

import { CheckSquare, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import { DetailSheetCollapsibleSection, EntityDetailSheetContent } from '@/components/shared';
import { cn } from '@/lib/utils';
import { buildTaskCompletionBlockers } from '../utils/task-completion-readiness';
import { TASK_OPEN_QUERY } from '../constants/task-open-query';
import { TASK_SHEET_SECTION_SURFACE_CLASS } from './task-sheet-classes';
import { TaskSheetSplitLayout } from './TaskSheetSplitLayout';
import { TaskSheetChatPanel } from './TaskSheetChatPanel';
import { TaskChecklistSection } from './TaskChecklistSection';
import { TaskCompletionRulesPanel } from './TaskCompletionRulesPanel';
import { TaskSubtasksSection } from './TaskSubtasksSection';
import { TaskSheetGeneralSection } from './TaskSheetGeneralSection';
import { TaskSheetHeader } from './TaskSheetHeader';
import { TaskSheetStickyFooter } from './TaskSheetStickyFooter';
import type { Task } from '@/lib/api/tasks';
import { useTaskSheetState } from './use-task-sheet-state';

interface TaskSheetProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  /** Stack above a parent entity sheet (related-item open from tab). */
  forceNestedBackdrop?: boolean;
}

const TASK_SHEET_WIDTH_CLASS =
  'flex w-full flex-col gap-0 p-0 shadow-2xl ring-1 ring-black/5 data-[side=right]:w-full sm:max-w-none sm:data-[side=right]:w-[min(96vw,112rem)] 2xl:data-[side=right]:w-[min(98vw,128rem)] dark:ring-white/10';

const TASK_SHEET_RAIL_ANCHOR_CLASS = 'sm:right-[min(96vw,112rem)] 2xl:right-[min(98vw,128rem)]';

export function TaskSheet({
  taskId,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  forceNestedBackdrop,
}: TaskSheetProps) {
  const state = useTaskSheetState({ taskId, open, onUpdate, onDelete });
  const [extrasOpen, setExtrasOpen] = useState(false);

  async function handleDelete() {
    if (!window.confirm('Delete this task? This action cannot be undone.')) return;
    const deleted = await state.handleDeleteTask();
    if (deleted) onOpenChange(false);
  }

  if (!state.task && !state.loading && !state.generalError) return null;

  const task = state.task;
  const blockers = task ? buildTaskCompletionBlockers(task) : [];
  const hasExtras =
    task != null &&
    (task.checklists.length > 0 ||
      task.subtasks.length > 0 ||
      (task.completionRules?.length ?? 0) > 0 ||
      blockers.length > 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        contentClassName={TASK_SHEET_WIDTH_CLASS}
        railAnchorClassName={TASK_SHEET_RAIL_ANCHOR_CLASS}
        showRailActions={Boolean(state.task)}
        forceNestedBackdrop={forceNestedBackdrop}
        sourcePageHref={
          state.task ? `/tasks?${TASK_OPEN_QUERY}=${encodeURIComponent(state.task.id)}` : '#'
        }
        workspaceHref={state.task?.workspaceId ? `/work-spaces/${state.task.workspaceId}` : null}
      >
        {state.loading && !state.task ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            <span className="sr-only">Loading task</span>
            <Loader2 className="text-muted-foreground size-5 animate-spin" aria-hidden />
          </div>
        ) : state.task && state.generalDraft ? (
          <>
            <TaskSheetSplitLayout
              detail={
                <>
                  <ScrollArea className="min-h-0 min-w-0 flex-1 overflow-hidden [&_[data-slot=scroll-area-viewport]]:min-w-0 [&_[data-slot=scroll-area-viewport]]:overflow-x-hidden">
                    <div className="min-w-0 space-y-3 px-4 py-4 sm:px-5">
                      {state.generalError && (
                        <div className="border-destructive/25 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
                          {state.generalError}
                        </div>
                      )}

                      <TaskSheetHeader
                        draft={state.generalDraft}
                        disabled={state.loading}
                        onPatchDraft={state.patchGeneralDraft}
                        onToggleUrgent={() => void state.handleToggleTaskUrgent()}
                      />

                      <TaskSheetGeneralSection
                        task={state.task}
                        taskId={state.task.id}
                        draft={state.generalDraft}
                        disabled={state.loading}
                        onPatchDraft={state.patchGeneralDraft}
                        onSearchEmployees={state.searchEmployees}
                      />

                      {hasExtras ? (
                        <DetailSheetCollapsibleSection
                          title="Checklist & rules"
                          icon={<CheckSquare size={12} />}
                          open={extrasOpen}
                          onOpenChange={setExtrasOpen}
                          className={TASK_SHEET_SECTION_SURFACE_CLASS}
                        >
                          <div className="space-y-4">
                            <TaskCompletionRulesPanel
                              task={state.task}
                              serverBlockers={state.completionBlockers}
                            />

                            {state.task.subtasks.length > 0 && (
                              <TaskSubtasksSection task={state.task} />
                            )}

                            {state.task.checklists.length > 0 && (
                              <TaskChecklistSection
                                task={state.task}
                                newChecklistTitle={state.newChecklistTitle}
                                newItemTexts={state.newItemTexts}
                                onNewChecklistTitleChange={state.setNewChecklistTitle}
                                onNewItemTextChange={(checklistId, value) =>
                                  state.setNewItemTexts((prev) => ({
                                    ...prev,
                                    [checklistId]: value,
                                  }))
                                }
                                onAddChecklist={state.handleAddChecklist}
                                onAddItem={state.handleAddItem}
                                onToggleItem={state.handleToggleItem}
                                onDeleteChecklist={state.handleDeleteChecklist}
                                onDeleteItem={state.handleDeleteItem}
                              />
                            )}
                          </div>
                        </DetailSheetCollapsibleSection>
                      ) : (
                        <div className={cn(TASK_SHEET_SECTION_SURFACE_CLASS, 'space-y-4')}>
                          <TaskCompletionRulesPanel
                            task={state.task}
                            serverBlockers={state.completionBlockers}
                          />
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
                      )}
                    </div>
                  </ScrollArea>

                  <TaskSheetStickyFooter
                    dirty={state.generalDirty}
                    workflowSaving={state.workflowSaving}
                    workflowFooterStatus={state.workflowFooterStatus}
                    errorMessage={state.generalError}
                    taskStatus={state.task?.status ?? 'OPEN'}
                    onSave={() => void state.handleGeneralSave()}
                    onCancel={state.handleGeneralCancel}
                    onTaskAction={state.handleAction}
                    onDelete={() => void handleDelete()}
                  />
                </>
              }
              chat={
                <TaskSheetChatPanel
                  task={state.task}
                  messages={state.taskMessages}
                  onSend={state.handleSendMessage}
                />
              }
            />
          </>
        ) : (
          <div className="text-muted-foreground p-5 text-sm">{state.generalError}</div>
        )}
      </EntityDetailSheetContent>
    </Sheet>
  );
}
