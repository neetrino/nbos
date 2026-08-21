'use client';

import { CheckSquare, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Sheet } from '@/components/ui/sheet';
import {
  DeleteConfirmDialog,
  DetailSheetCollapsibleSection,
  EntityDetailSheetContent,
} from '@/components/shared';
import {
  buildTaskCompletionBlockers,
  getEnabledCompletionRules,
} from '../utils/task-completion-readiness';
import { normalizeTaskStatusForDraft } from '../utils/task-status-draft';
import { TASK_OPEN_QUERY } from '../constants/task-open-query';
import {
  TASK_SHEET_RAIL_ANCHOR_CLASS,
  TASK_SHEET_SECTION_SURFACE_CLASS,
  TASK_SHEET_WIDTH_CLASS,
} from './task-sheet-classes';
import { TaskSheetSplitLayout } from './TaskSheetSplitLayout';
import { TaskSheetChatPanel } from './TaskSheetChatPanel';
import { TaskChecklistSection } from './TaskChecklistSection';
import { TaskCompletionRulesPanel } from './TaskCompletionRulesPanel';
import { TaskPipelineStages } from './TaskPipelineStages';
import { TaskSubtasksSection } from './TaskSubtasksSection';
import { TaskSheetGeneralSection } from './TaskSheetGeneralSection';
import { TaskSheetHeader } from './TaskSheetHeader';
import { TaskSheetStickyFooter } from './TaskSheetStickyFooter';
import type { Task } from '@/lib/api/tasks';
import { useTaskSheetState } from './use-task-sheet-state';
import { useTaskDiscussion } from './use-task-discussion';
import { canDeleteTaskDraft, canMoveTaskToTrash, isTaskInTrash } from '../utils/task-draft-delete';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';

interface TaskSheetProps {
  taskId: string | null;
  initialTask?: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onRestore?: (taskId: string) => void;
  isTrashView?: boolean;
  /** Stack above a parent entity sheet (related-item open from tab). */
  forceNestedBackdrop?: boolean;
}

export function TaskSheet({
  taskId,
  initialTask = null,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  onRestore,
  isTrashView = false,
  forceNestedBackdrop,
}: TaskSheetProps) {
  const { persistedValue: sheetId, onOpenChangeComplete } = useSheetPersistedValue(taskId);
  const hostMounted = useSheetHostMounted(open, sheetId);
  const state = useTaskSheetState({
    taskId: sheetId,
    open,
    initialTask,
    onUpdate,
    onDelete,
    onRestore,
  });
  const discussion = useTaskDiscussion(sheetId, open);
  const [extrasOpen, setExtrasOpen] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const task = state.task;
  const isTrashed = Boolean(task && (isTaskInTrash(task) || isTrashView));
  const canDeleteDraft = task && !isTrashed ? canDeleteTaskDraft(task) : false;
  const canMoveToTrash = task && !isTrashed ? canMoveTaskToTrash(task) : false;
  const readOnly = isTrashed;

  async function handleDelete() {
    const deleted = await state.handleDeleteTask();
    if (deleted) onOpenChange(false);
  }

  async function handleRestore() {
    const restored = await state.handleRestoreTask();
    if (restored) onOpenChange(false);
  }

  if (!hostMounted) return null;

  const blockers = task ? buildTaskCompletionBlockers(task) : [];
  const hasExtras =
    task != null &&
    (task.subtasks.length > 0 || getEnabledCompletionRules(task).length > 0 || blockers.length > 0);
  const pipelineStatus =
    state.workflowFooterStatus ??
    (state.task ? normalizeTaskStatusForDraft(state.task.status) : 'OPEN');

  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <EntityDetailSheetContent
        open={open}
        contentClassName={TASK_SHEET_WIDTH_CLASS}
        railAnchorClassName={TASK_SHEET_RAIL_ANCHOR_CLASS}
        showRailActions={Boolean(state.task)}
        forceNestedBackdrop={forceNestedBackdrop}
        sourcePageHref={
          state.task
            ? `/tasks?${TASK_OPEN_QUERY}=${encodeURIComponent(state.task.id)}`
            : sheetId
              ? `/tasks?${TASK_OPEN_QUERY}=${encodeURIComponent(sheetId)}`
              : '#'
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
            <div className="bg-background shrink-0 px-7 pt-5 pb-3">
              <TaskSheetHeader
                draft={state.generalDraft}
                disabled={state.loading || readOnly}
                onPatchDraft={state.patchGeneralDraft}
                onToggleUrgent={() => void state.handleToggleTaskUrgent()}
                moreActions={
                  !isTrashed
                    ? {
                        taskStatus: pipelineStatus,
                        workflowSaving: state.workflowSaving,
                        onTaskAction: state.handleAction,
                        canDeleteDraft,
                        canMoveToTrash,
                        onDelete: () => setDeleteOpen(true),
                        onMoveToTrash: () => setDeleteOpen(true),
                      }
                    : null
                }
              />
            </div>

            <div className="shrink-0 pb-3">
              <TaskPipelineStages
                currentStatus={pipelineStatus}
                disabled={state.loading || readOnly || state.workflowSaving}
                onStageClick={state.handlePipelineStatusClick}
              />
            </div>

            <TaskSheetSplitLayout
              detail={
                <>
                  <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="min-w-0 space-y-3 px-4 py-4 sm:px-5">
                      {state.generalError && (
                        <div className="border-destructive/25 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
                          {state.generalError}
                        </div>
                      )}

                      <TaskSheetGeneralSection
                        task={state.task}
                        taskId={state.task.id}
                        draft={state.generalDraft}
                        disabled={state.loading || readOnly}
                        onPatchDraft={state.patchGeneralDraft}
                        onLinksChange={state.handleLinksChange}
                        onTaskChange={state.handleTaskChange}
                        onSearchEmployees={state.searchEmployees}
                      />

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

                      {hasExtras ? (
                        <DetailSheetCollapsibleSection
                          title="Rules"
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
                            {state.task.subtasks.length > 0 ? (
                              <TaskSubtasksSection task={state.task} />
                            ) : null}
                          </div>
                        </DetailSheetCollapsibleSection>
                      ) : null}
                    </div>
                  </div>

                  <TaskSheetStickyFooter
                    dirty={state.generalDirty}
                    workflowSaving={state.workflowSaving}
                    workflowFooterStatus={state.workflowFooterStatus}
                    errorMessage={state.generalError}
                    taskStatus={state.task?.status ?? 'OPEN'}
                    onSave={() => void state.handleGeneralSave()}
                    onCancel={state.handleGeneralCancel}
                    onTaskAction={state.handleAction}
                    isTrashed={isTrashed}
                    onRestore={onRestore ? () => void handleRestore() : undefined}
                  />
                </>
              }
              chat={
                <TaskSheetChatPanel
                  task={state.task}
                  messages={discussion.messages}
                  onSend={(body) => {
                    void discussion.send(body);
                  }}
                />
              }
            />
          </>
        ) : (
          <div className="text-muted-foreground p-5 text-sm">{state.generalError}</div>
        )}
      </EntityDetailSheetContent>

      <DeleteConfirmDialog
        level="simple"
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={state.task?.title ?? ''}
        title={canDeleteDraft ? 'Delete draft task?' : 'Move to Trash?'}
        description={
          canDeleteDraft
            ? 'Only empty OPEN tasks can be deleted. This removes the task permanently.'
            : 'The task will be removed from boards and lists. You can restore it from Trash later.'
        }
        forceNestedBackdrop
        onConfirm={async () => {
          setDeleteOpen(false);
          await handleDelete();
        }}
      />
    </Sheet>
  );
}
