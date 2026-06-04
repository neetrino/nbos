'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { KanbanColumn } from '@/components/shared';
import {
  buildDeadlineKanbanColumns,
  buildMyPlanColumns,
  buildWorkspaceKanbanColumns,
  buildWorkspacePlanningColumns,
  resolvePlanningColumnKey,
  useTaskBoardMutations,
  type TaskBoardAction,
} from '@/features/tasks/task-board';
import { tasksApi, type Task, type TaskBoardStage } from '@/lib/api/tasks';
import { taskInvolvesEmployee } from '@/features/tasks/utils/task-involves-employee';
import {
  filterTasksForWorkspaceView,
  resolveWorkspaceBoardScope,
} from './workspace-task-view-filter';
import { filterTasksForScrumDailyExecution } from './workspace-scrum-daily-filter';
import type { WorkspaceArea } from './workspace-area';

export type WorkspaceBoardView = 'deadline' | 'my-plan' | 'kanban' | 'list' | 'planning';

export type WorkspaceBoardControlledState = {
  boardView: WorkspaceBoardView;
  setBoardView: Dispatch<SetStateAction<WorkspaceBoardView>>;
};

export type WorkspaceViewFilters = {
  search: string;
  filterValues: Record<string, string>;
};

const DEFAULT_WORKSPACE_VIEW_FILTERS: WorkspaceViewFilters = {
  search: '',
  filterValues: {},
};

export function useWorkspaceRuntimeBoard(
  tasks: Task[],
  setTasks: Dispatch<SetStateAction<Task[]>>,
  myPlanOwnerId: string | null,
  viewFilters: WorkspaceViewFilters = DEFAULT_WORKSPACE_VIEW_FILTERS,
  controlledBoard?: WorkspaceBoardControlledState | null,
  scrumEnabled = false,
  activeSprintId: string | null = null,
  workspaceArea: WorkspaceArea = 'active',
) {
  const [internalBoardView, setInternalBoardView] = useState<WorkspaceBoardView>('kanban');
  const boardView = controlledBoard?.boardView ?? internalBoardView;
  const setBoardView = controlledBoard?.setBoardView ?? setInternalBoardView;
  const [myPlanStages, setMyPlanStages] = useState<TaskBoardStage[]>([]);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [defaultCreateDueDate, setDefaultCreateDueDate] = useState<string | null>(null);
  const [quickCreateColumnKey, setQuickCreateColumnKey] = useState<string | null>(null);

  useEffect(() => {
    if (!myPlanOwnerId) return;
    let cancelled = false;
    void (async () => {
      try {
        const stages = await tasksApi.getMyPlanStages(myPlanOwnerId);
        if (!cancelled) setMyPlanStages(stages);
      } catch {
        /* non-blocking */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [myPlanOwnerId]);

  const boardMutations = useTaskBoardMutations({
    tasks,
    setTasks,
    boardView,
    quickCreateColumnKey,
    setQuickCreateColumnKey,
    setQuickCreateOpen,
    setDefaultCreateDueDate,
    myPlanOwnerId,
    myPlanStages,
    setMyPlanStages,
  });

  const myPlanStagesForView = myPlanOwnerId ? myPlanStages : [];

  const viewTasks = useMemo(() => {
    const filtered = filterTasksForWorkspaceView(
      tasks,
      viewFilters.search,
      viewFilters.filterValues,
    );
    return filterTasksForScrumDailyExecution(filtered, {
      scrumEnabled,
      boardView,
      workspaceArea,
      activeSprintId,
    });
  }, [
    tasks,
    viewFilters.search,
    viewFilters.filterValues,
    scrumEnabled,
    boardView,
    workspaceArea,
    activeSprintId,
  ]);

  const myPlanBoardTasks = useMemo(() => {
    if (boardView !== 'my-plan') return viewTasks;
    if (!myPlanOwnerId) return [];
    return viewTasks.filter((task) => taskInvolvesEmployee(task, myPlanOwnerId));
  }, [boardView, viewTasks, myPlanOwnerId]);

  const handlePlanningMove = useCallback(
    async (taskId: string, _from: string, toColumn: string) => {
      const planningStatus = resolvePlanningColumnKey(toColumn);
      const task = tasks.find((item) => item.id === taskId);
      if (!task || task.planningStatus === planningStatus) return;

      const previousTasks = tasks;
      setTasks((prev) =>
        prev.map((item) => (item.id === taskId ? { ...item, planningStatus } : item)),
      );

      try {
        await tasksApi.update(taskId, { planningStatus });
      } catch {
        setTasks(previousTasks);
      }
    },
    [tasks, setTasks],
  );

  const boardScope = resolveWorkspaceBoardScope(viewFilters.filterValues);

  const buildDeadlineColumns = useCallback(
    (): KanbanColumn<Task>[] => buildDeadlineKanbanColumns(viewTasks, boardScope),
    [viewTasks, boardScope],
  );

  return {
    boardScope,
    boardView,
    setBoardView,
    myPlanStages,
    quickCreateOpen,
    setQuickCreateOpen,
    defaultCreateDueDate,
    setDefaultCreateDueDate,
    setQuickCreateColumnKey,
    handleQuickCreateTask: boardMutations.handleQuickCreateTask,
    handleAction: boardMutations.handleAction as (
      taskId: string,
      action: TaskBoardAction,
    ) => Promise<void>,
    handleKanbanMove: boardMutations.handleKanbanMove,
    handleKanbanReorder: boardMutations.handleKanbanReorder,
    handleMyPlanMove: boardMutations.handleMyPlanMove,
    handleMyPlanReorder: boardMutations.handleMyPlanReorder,
    handleDeadlineMove: boardMutations.handleDeadlineMove,
    handleDeadlineReorder: boardMutations.handleDeadlineReorder,
    handleAddTaskInColumn: boardMutations.handleAddTaskInColumn,
    handleAddMyPlanStage: boardMutations.handleAddMyPlanStage,
    handleRenameMyPlanStage: boardMutations.handleRenameMyPlanStage,
    handleDeleteMyPlanStage: boardMutations.handleDeleteMyPlanStage,
    buildWorkspaceKanbanColumns: () => buildWorkspaceKanbanColumns(viewTasks, boardScope),
    buildWorkspacePlanningColumns: () => buildWorkspacePlanningColumns(viewTasks),
    buildMyPlanColumns: () => buildMyPlanColumns(myPlanBoardTasks, myPlanStagesForView),
    handlePlanningMove,
    buildDeadlineColumns,
    viewTasks,
  };
}
