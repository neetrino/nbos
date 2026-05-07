'use client';

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { CheckSquare, Clock, LayoutGrid, Plus, RefreshCcw, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EmptyState, KanbanBoard } from '@/components/shared';
import {
  TaskMiniCard,
  partitionWorkspaceSecondaryTasks,
  type TaskBoardAction,
} from '@/features/tasks/task-board';
import { TaskSheet } from '@/features/tasks/components/TaskSheet';
import { QuickCreateTaskDialog } from '@/features/tasks/components/QuickCreateTaskDialog';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { Task, WorkSpace } from '@/lib/api/tasks';
import { useWorkspaceRuntimeBoard } from './use-workspace-runtime-board';
import { WorkSpaceSecondaryTasksSection } from './WorkSpaceSecondaryTasksSection';

const CURRENT_USER_ID = 'current-user';

export type WorkSpaceRuntimeProps = {
  workspace: WorkSpace;
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  onRefresh: () => void;
  mode: 'standalone' | 'embedded';
  defaultTaskLink?: { entityType: string; entityId: string };
};

export function WorkSpaceRuntime({
  workspace,
  tasks,
  setTasks,
  onRefresh,
  mode,
  defaultTaskLink,
}: WorkSpaceRuntimeProps) {
  const {
    boardView,
    setBoardView,
    fetchMyPlanStages,
    quickCreateOpen,
    setQuickCreateOpen,
    defaultCreateDueDate,
    setDefaultCreateDueDate,
    handleAction,
    handleKanbanMove,
    handleMyPlanMove,
    handleDeadlineMove,
    handleAddTaskInColumn,
    handleAddMyPlanStage,
    handleRenameMyPlanStage,
    handleDeleteMyPlanStage,
    buildWorkspaceKanbanColumns,
    buildMyPlanColumns,
    buildDeadlineColumns,
  } = useWorkspaceRuntimeBoard(tasks, setTasks);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    void fetchMyPlanStages(CURRENT_USER_ID);
  }, [fetchMyPlanStages]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTaskId(task.id);
    setSheetOpen(true);
  }, []);

  const handleCardAction = useCallback(
    async (taskId: string, action: TaskBoardAction) => {
      try {
        await handleAction(taskId, action);
        setActionError(null);
      } catch (caught) {
        setActionError(getApiErrorMessage(caught, 'Task action could not be completed.'));
      }
    },
    [handleAction],
  );

  const handleTaskUpdate = useCallback(
    (updated: Task) => {
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    },
    [setTasks],
  );

  const handleTaskCreated = useCallback(
    (task: Task) => {
      setTasks((prev) => [task, ...prev]);
    },
    [setTasks],
  );

  const openQuickCreate = useCallback(() => {
    setDefaultCreateDueDate(null);
    setQuickCreateOpen(true);
  }, [setDefaultCreateDueDate, setQuickCreateOpen]);

  const renderCard = useCallback(
    (task: Task) => (
      <TaskMiniCard task={task} onAction={handleCardAction} onClick={handleTaskClick} />
    ),
    [handleCardAction, handleTaskClick],
  );

  const renderBoard = () => {
    if (boardView === 'deadline') {
      return (
        <div className="min-h-0 flex-1">
          <KanbanBoard
            columns={buildDeadlineColumns()}
            renderCard={renderCard}
            getItemId={(t) => t.id}
            onMove={handleDeadlineMove}
            onAddItemInColumn={handleAddTaskInColumn}
            addButtonLabel="Quick"
            columnWidth={240}
            emptyMessage="No tasks"
          />
        </div>
      );
    }

    if (boardView === 'kanban') {
      return (
        <div className="min-h-0 flex-1">
          <KanbanBoard
            columns={buildWorkspaceKanbanColumns()}
            renderCard={renderCard}
            getItemId={(t) => t.id}
            onMove={handleKanbanMove}
            onAddItemInColumn={handleAddTaskInColumn}
            addButtonLabel="Quick"
            columnWidth={270}
            emptyMessage="No tasks"
          />
        </div>
      );
    }

    return (
      <div className="min-h-0 flex-1">
        <KanbanBoard
          columns={buildMyPlanColumns()}
          renderCard={renderCard}
          getItemId={(t) => t.id}
          onMove={handleMyPlanMove}
          onAddColumn={(title, color) => handleAddMyPlanStage(title, color, CURRENT_USER_ID)}
          onRenameColumn={handleRenameMyPlanStage}
          onDeleteColumn={handleDeleteMyPlanStage}
          onAddItemInColumn={handleAddTaskInColumn}
          addButtonLabel="Quick"
          columnWidth={270}
          emptyMessage="No tasks"
        />
      </div>
    );
  };

  const { deferred, cancelled } = partitionWorkspaceSecondaryTasks(tasks);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4" data-workspace-runtime={mode}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="border-border bg-muted/50 flex flex-wrap items-center gap-0.5 rounded-lg border p-0.5">
          <button
            type="button"
            onClick={() => setBoardView('deadline')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all',
              boardView === 'deadline'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Clock size={14} />
            Deadline
          </button>
          <button
            type="button"
            onClick={() => setBoardView('my-plan')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all',
              boardView === 'my-plan'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <User size={14} />
            My Plan
          </button>
          <button
            type="button"
            onClick={() => setBoardView('kanban')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all',
              boardView === 'kanban'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <LayoutGrid size={14} />
            Board
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Refresh work space">
            <RefreshCcw size={16} />
          </Button>
          <Button onClick={openQuickCreate}>
            <Plus size={16} />
            New Task
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks in this Work Space"
          description="Create a task to start planning work here."
          action={
            <Button onClick={openQuickCreate}>
              <Plus size={16} /> Create first task
            </Button>
          }
        />
      ) : (
        <>
          {renderBoard()}
          <WorkSpaceSecondaryTasksSection
            deferred={deferred}
            cancelled={cancelled}
            onAction={handleCardAction}
            onOpenTask={handleTaskClick}
          />
        </>
      )}

      <TaskSheet
        taskId={selectedTaskId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdate={handleTaskUpdate}
      />

      <QuickCreateTaskDialog
        open={quickCreateOpen}
        onOpenChange={(open) => {
          setQuickCreateOpen(open);
          if (!open) setDefaultCreateDueDate(null);
        }}
        creatorId={CURRENT_USER_ID}
        defaultWorkspaceId={workspace.id}
        defaultPlanningStatus={workspace.scrumEnabled ? 'BACKLOG' : 'UNPLANNED'}
        defaultDueDate={defaultCreateDueDate}
        defaultLink={defaultTaskLink}
        onCreated={handleTaskCreated}
      />
    </div>
  );
}
