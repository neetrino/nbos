'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '@/components/shared';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskMiniCard, TaskListTableView, type TaskBoardAction } from '@/features/tasks/task-board';
import { TaskSheet } from '@/features/tasks/components/TaskSheet';
import { QuickCreateTaskDialog } from '@/features/tasks/components/QuickCreateTaskDialog';
import { getApiErrorMessage } from '@/lib/api-errors';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { TASK_OPEN_QUERY } from '@/features/tasks/constants/task-open-query';
import { TASKS_WORKSPACE_BOARD_VIEW_SEGMENTS } from '@/features/tasks/tasks-board-view-segments';
import type { Task, WorkSpace } from '@/lib/api/tasks';
import { useWorkspaceRuntimeBoard, type WorkspaceBoardView } from './use-workspace-runtime-board';
import { WorkspaceRuntimeFilterBar } from './workspace-runtime-filter-bar';

export type WorkSpaceRuntimeProps = {
  workspace: WorkSpace;
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  mode: 'standalone' | 'embedded';
  defaultTaskLink?: { entityType: string; entityId: string };
  /** When false, board view tabs + New Task live in the page header (standalone). */
  hideInlineBoardToolbar?: boolean;
  boardView?: WorkspaceBoardView;
  setBoardView?: Dispatch<SetStateAction<WorkspaceBoardView>>;
  quickCreateRef?: MutableRefObject<(() => void) | null>;
  /**
   * When true (e.g. `/work-spaces/[id]`), task sheet syncs with `TASK_OPEN_QUERY` in the URL.
   * Leave false for embedded hosts (e.g. product tab) so their route query is not modified.
   */
  syncTaskSheetToUrl?: boolean;
};

export function WorkSpaceRuntime({
  workspace,
  tasks,
  setTasks,
  mode,
  defaultTaskLink,
  hideInlineBoardToolbar = false,
  boardView: boardViewProp,
  setBoardView: setBoardViewProp,
  quickCreateRef,
  syncTaskSheetToUrl = false,
}: WorkSpaceRuntimeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openTaskIdFromUrl = searchParams.get(TASK_OPEN_QUERY)?.trim() || null;

  const { creatorId, creatorReady } = useTaskCreatorId();
  const [taskSearch, setTaskSearch] = useState('');
  const [taskFilters, setTaskFilters] = useState<Record<string, string>>({});

  const workspaceViewFilters = useMemo(
    () => ({ search: taskSearch, filterValues: taskFilters }),
    [taskSearch, taskFilters],
  );

  const controlledBoard =
    hideInlineBoardToolbar && boardViewProp !== undefined && setBoardViewProp
      ? { boardView: boardViewProp, setBoardView: setBoardViewProp }
      : null;

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
    buildWorkspacePlanningColumns,
    buildMyPlanColumns,
    buildDeadlineColumns,
    handlePlanningMove,
    viewTasks,
  } = useWorkspaceRuntimeBoard(
    tasks,
    setTasks,
    creatorId,
    workspaceViewFilters,
    controlledBoard,
    workspace.scrumEnabled,
  );

  const [localSelectedTaskId, setLocalSelectedTaskId] = useState<string | null>(null);
  const [localSheetOpen, setLocalSheetOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const stripTaskOpenFromUrl = useCallback(() => {
    if (!syncTaskSheetToUrl) return;
    const p = new URLSearchParams(searchParams.toString());
    if (!p.has(TASK_OPEN_QUERY)) return;
    p.delete(TASK_OPEN_QUERY);
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [syncTaskSheetToUrl, router, pathname, searchParams]);

  const selectedTaskId = syncTaskSheetToUrl ? openTaskIdFromUrl : localSelectedTaskId;
  const sheetOpen = syncTaskSheetToUrl ? Boolean(openTaskIdFromUrl) : localSheetOpen;

  const handleTaskClick = useCallback(
    (task: Task) => {
      if (syncTaskSheetToUrl) {
        const p = new URLSearchParams(searchParams.toString());
        p.set(TASK_OPEN_QUERY, task.id);
        const qs = p.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
      } else {
        setLocalSelectedTaskId(task.id);
        setLocalSheetOpen(true);
      }
    },
    [syncTaskSheetToUrl, searchParams, router, pathname],
  );

  const handleTaskSheetOpenChange = useCallback(
    (open: boolean) => {
      if (syncTaskSheetToUrl) {
        if (!open) stripTaskOpenFromUrl();
      } else {
        setLocalSheetOpen(open);
        if (!open) setLocalSelectedTaskId(null);
      }
    },
    [syncTaskSheetToUrl, stripTaskOpenFromUrl],
  );

  const handleTaskDeleteFromSheet = useCallback(
    (taskId: string) => {
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      if (syncTaskSheetToUrl) {
        if (openTaskIdFromUrl === taskId) stripTaskOpenFromUrl();
      } else {
        setLocalSelectedTaskId((current) => (current === taskId ? null : current));
        setLocalSheetOpen(false);
      }
    },
    [setTasks, syncTaskSheetToUrl, openTaskIdFromUrl, stripTaskOpenFromUrl],
  );

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

  useEffect(() => {
    if (!quickCreateRef) return;
    quickCreateRef.current = openQuickCreate;
    return () => {
      quickCreateRef.current = null;
    };
  }, [quickCreateRef, openQuickCreate]);

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

    if (boardView === 'planning') {
      return (
        <div className="min-h-0 flex-1">
          <KanbanBoard
            columns={buildWorkspacePlanningColumns()}
            renderCard={renderCard}
            getItemId={(t) => t.id}
            onMove={handlePlanningMove}
            onAddItemInColumn={handleAddTaskInColumn}
            addButtonLabel="Quick"
            columnWidth={240}
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

  const newTaskDisabled = creatorReady && !creatorId;
  const hasActiveTaskViewQuery =
    Boolean(taskSearch.trim()) ||
    Object.entries(taskFilters).some(([, v]) => Boolean(v) && v !== 'all');

  const showWorkspaceBoard = tasks.length === 0 || viewTasks.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4" data-workspace-runtime={mode}>
      <WorkspaceRuntimeFilterBar
        search={taskSearch}
        onSearchChange={setTaskSearch}
        filterValues={taskFilters}
        onFilterChange={(key, value) => setTaskFilters((prev) => ({ ...prev, [key]: value }))}
        onClearFilters={clearTaskViewFilters}
      />

      {!hideInlineBoardToolbar ? (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <Tabs
            value={boardView}
            onValueChange={(value) => setBoardView(value as WorkspaceBoardView)}
          >
            <TabsList variant="segmented">
              {TASKS_WORKSPACE_BOARD_VIEW_SEGMENTS.map((segment) => (
                <TabsTrigger
                  key={segment.value}
                  value={segment.value}
                  aria-label={segment.ariaLabel}
                  className="gap-1.5 px-3 py-2"
                >
                  {segment.icon}
                  {segment.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            onClick={openQuickCreate}
            disabled={newTaskDisabled}
            title={newTaskDisabled ? 'Employee profile required' : undefined}
          >
            <Plus size={16} />
            New Task
          </Button>
        </div>
      ) : null}

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
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

      {showWorkspaceBoard ? renderBoard() : null}

      <TaskSheet
        taskId={selectedTaskId}
        open={sheetOpen}
        onOpenChange={handleTaskSheetOpenChange}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDeleteFromSheet}
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
