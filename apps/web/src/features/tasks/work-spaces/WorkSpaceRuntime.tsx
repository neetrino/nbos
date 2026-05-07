'use client';

import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { CheckSquare, Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanBoard, SegmentedControl } from '@/components/shared';
import {
  TaskMiniCard,
  TaskListTableView,
  TaskOffPrimaryBoardSection,
  partitionWorkspaceSecondaryTasks,
  type TaskBoardAction,
} from '@/features/tasks/task-board';
import { TaskSheet } from '@/features/tasks/components/TaskSheet';
import { QuickCreateTaskDialog } from '@/features/tasks/components/QuickCreateTaskDialog';
import { getApiErrorMessage } from '@/lib/api-errors';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { TASKS_BOARD_VIEW_SEGMENTS } from '@/features/tasks/tasks-board-view-segments';
import type { Task, WorkSpace } from '@/lib/api/tasks';
import { useWorkspaceRuntimeBoard } from './use-workspace-runtime-board';
import { WorkspaceRuntimeFilterBar } from './workspace-runtime-filter-bar';

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
  const { creatorId, creatorReady } = useTaskCreatorId();
  const [taskSearch, setTaskSearch] = useState('');
  const [taskFilters, setTaskFilters] = useState<Record<string, string>>({});

  const workspaceViewFilters = useMemo(
    () => ({ search: taskSearch, filterValues: taskFilters }),
    [taskSearch, taskFilters],
  );

  const {
    boardView,
    setBoardView,
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
    viewTasks,
  } = useWorkspaceRuntimeBoard(tasks, setTasks, creatorId, workspaceViewFilters);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const clearTaskViewFilters = useCallback(() => {
    setTaskSearch('');
    setTaskFilters({});
  }, []);

  const renderCard = useCallback(
    (task: Task) => (
      <TaskMiniCard task={task} onAction={handleCardAction} onClick={handleTaskClick} />
    ),
    [handleCardAction, handleTaskClick],
  );

  const renderBoard = () => {
    if (boardView === 'list') {
      return (
        <div className="min-h-0 flex-1 overflow-auto">
          <TaskListTableView tasks={viewTasks} onRowClick={handleTaskClick} />
        </div>
      );
    }

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
          onAddColumn={handleAddMyPlanStage}
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

  const { deferred, cancelled } = partitionWorkspaceSecondaryTasks(viewTasks);
  const newTaskDisabled = creatorReady && !creatorId;
  const hasActiveTaskViewQuery =
    Boolean(taskSearch.trim()) ||
    Object.entries(taskFilters).some(([, v]) => Boolean(v) && v !== 'all');

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4" data-workspace-runtime={mode}>
      <WorkspaceRuntimeFilterBar
        search={taskSearch}
        onSearchChange={setTaskSearch}
        filterValues={taskFilters}
        onFilterChange={(key, value) => setTaskFilters((prev) => ({ ...prev, [key]: value }))}
        onClearFilters={clearTaskViewFilters}
      />

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <SegmentedControl
          value={boardView}
          onValueChange={setBoardView}
          items={TASKS_BOARD_VIEW_SEGMENTS}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Refresh work space">
            <RefreshCcw size={16} />
          </Button>
          <Button
            onClick={openQuickCreate}
            disabled={newTaskDisabled}
            title={newTaskDisabled ? 'Employee profile required' : undefined}
          >
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

      {tasks.length === 0 && (
        <div className="border-border bg-muted/30 flex items-start gap-3 rounded-lg border px-4 py-3">
          <CheckSquare className="text-muted-foreground mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">No tasks in this Work Space yet</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Columns stay visible on Board, Deadline, and My Plan. Use New Task or Quick in a
              column to add work.
            </p>
            {!newTaskDisabled && (
              <Button className="mt-3" size="sm" onClick={openQuickCreate}>
                <Plus size={14} /> Create first task
              </Button>
            )}
          </div>
        </div>
      )}

      {tasks.length > 0 && viewTasks.length === 0 ? (
        <div className="border-border bg-muted/20 text-muted-foreground rounded-xl border border-dashed px-4 py-10 text-center text-sm">
          <p>No tasks match your search or filters.</p>
          {hasActiveTaskViewQuery ? (
            <Button className="mt-4" variant="outline" size="sm" onClick={clearTaskViewFilters}>
              Clear search and filters
            </Button>
          ) : null}
        </div>
      ) : null}

      {tasks.length > 0 && viewTasks.length > 0 ? renderBoard() : null}

      {tasks.length > 0 && viewTasks.length > 0 ? (
        <TaskOffPrimaryBoardSection
          deferred={deferred}
          cancelled={cancelled}
          onAction={handleCardAction}
          onOpenTask={handleTaskClick}
        />
      ) : null}

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
        creatorId={creatorId ?? ''}
        creatorReady={creatorReady}
        defaultWorkspaceId={workspace.id}
        defaultPlanningStatus={workspace.scrumEnabled ? 'BACKLOG' : 'UNPLANNED'}
        defaultDueDate={defaultCreateDueDate}
        defaultLink={defaultTaskLink}
        onCreated={handleTaskCreated}
      />
    </div>
  );
}
