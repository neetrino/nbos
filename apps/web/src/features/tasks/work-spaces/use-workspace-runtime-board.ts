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
  DEADLINE_COLUMNS_DEF,
  KANBAN_STATUS_MAP,
  getDeadlineColumn,
  getDueDateForDeadlineColumn,
  buildWorkspaceKanbanColumns,
  buildMyPlanColumns,
  buildWorkspacePlanningColumns,
  resolvePlanningColumnKey,
  reorderTasksInColumn,
  taskMatchesDeadlineColumn,
  taskMatchesKanbanStatusColumn,
  taskMatchesMyPlanColumn,
} from '@/features/tasks/task-board';
import type { TaskBoardAction } from '@/features/tasks/task-board';
import { tasksApi, type Task, type TaskBoardStage } from '@/lib/api/tasks';

import { taskInvolvesEmployee } from '@/features/tasks/utils/task-involves-employee';
import { filterTasksForWorkspaceView } from './workspace-task-view-filter';
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
    return viewTasks.filter((t) => taskInvolvesEmployee(t, myPlanOwnerId));
  }, [boardView, viewTasks, myPlanOwnerId]);

  const handleAction = useCallback(
    async (taskId: string, action: TaskBoardAction) => {
      const updated = await tasksApi[action](taskId);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    },
    [setTasks],
  );

  const handlePlanningMove = useCallback(
    async (taskId: string, _from: string, toColumn: string) => {
      const planningStatus = resolvePlanningColumnKey(toColumn);
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.planningStatus === planningStatus) return;

      const prevTasks = tasks;
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, planningStatus } : t)));

      try {
        await tasksApi.update(taskId, { planningStatus });
      } catch {
        setTasks(prevTasks);
      }
    },
    [tasks, setTasks],
  );

  const handleKanbanReorder = useCallback(
    (taskId: string, columnKey: string, toIndex: number) => {
      setTasks((prev) =>
        reorderTasksInColumn(prev, taskId, toIndex, (task) =>
          taskMatchesKanbanStatusColumn(task, columnKey),
        ),
      );
    },
    [setTasks],
  );

  const handleDeadlineReorder = useCallback(
    (taskId: string, columnKey: string, toIndex: number) => {
      setTasks((prev) =>
        reorderTasksInColumn(prev, taskId, toIndex, (task) =>
          taskMatchesDeadlineColumn(task, columnKey),
        ),
      );
    },
    [setTasks],
  );

  const handleMyPlanReorder = useCallback(
    (taskId: string, columnKey: string, toIndex: number) => {
      setTasks((prev) =>
        reorderTasksInColumn(prev, taskId, toIndex, (task) =>
          taskMatchesMyPlanColumn(task, columnKey),
        ),
      );
    },
    [setTasks],
  );

  const handleKanbanMove = useCallback(
    async (taskId: string, _from: string, toColumn: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const targetStatus = KANBAN_STATUS_MAP[toColumn] ?? toColumn.toUpperCase().replace(/ /g, '_');

      const normalizedCurrent =
        task.status === 'NEW' && targetStatus === 'OPEN' ? 'OPEN' : task.status;
      if (normalizedCurrent === targetStatus) return;

      const prevTasks = tasks;
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)));

      try {
        if (
          targetStatus === 'IN_PROGRESS' &&
          (task.status === 'OPEN' || task.status === 'NEW' || task.status === 'ON_HOLD')
        ) {
          await tasksApi.start(taskId);
        } else if (targetStatus === 'COMPLETED' || targetStatus === 'DONE') {
          await tasksApi.complete(taskId);
        } else if (targetStatus === 'OPEN' && task.status !== 'OPEN' && task.status !== 'NEW') {
          await tasksApi.reopen(taskId);
        } else {
          await tasksApi.update(taskId, { status: targetStatus });
        }
      } catch {
        setTasks(prevTasks);
      }
    },
    [tasks, setTasks],
  );

  const handleMyPlanMove = useCallback(
    async (taskId: string, _from: string, toStageId: string) => {
      const prevTasks = tasks;
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, myPlanStageId: toStageId } : t)),
      );

      try {
        await tasksApi.update(taskId, { myPlanStageId: toStageId });
      } catch {
        setTasks(prevTasks);
      }
    },
    [tasks, setTasks],
  );

  const handleDeadlineMove = useCallback(
    async (taskId: string, _from: string, toColumnKey: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const prevTasks = tasks;

      if (toColumnKey === 'done') {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: 'COMPLETED' as const } : t)),
        );
        try {
          await tasksApi.complete(taskId);
        } catch {
          setTasks(prevTasks);
        }
        return;
      }

      const newDueDate = getDueDateForDeadlineColumn(toColumnKey);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                dueDate: newDueDate,
                status:
                  task.status === 'COMPLETED' || task.status === 'DONE'
                    ? ('OPEN' as const)
                    : t.status,
              }
            : t,
        ),
      );

      try {
        const updates: Record<string, unknown> = { dueDate: newDueDate };
        if (task.status === 'COMPLETED' || task.status === 'DONE') {
          await tasksApi.reopen(taskId);
          await tasksApi.update(taskId, updates);
        } else {
          await tasksApi.update(taskId, updates);
        }
      } catch {
        setTasks(prevTasks);
      }
    },
    [tasks, setTasks],
  );

  const handleAddTaskInColumn = useCallback(
    (columnKey: string) => {
      const useDeadline =
        boardView === 'deadline' ? (getDueDateForDeadlineColumn(columnKey) ?? null) : null;
      setDefaultCreateDueDate(useDeadline);
      setQuickCreateOpen(true);
    },
    [boardView],
  );

  const handleAddMyPlanStage = useCallback(
    async (title: string, color: string) => {
      if (!myPlanOwnerId) return;
      try {
        const stage = await tasksApi.createStage({
          title,
          color,
          ownerId: myPlanOwnerId,
        });
        setMyPlanStages((prev) => [...prev, stage]);
      } catch {
        /* non-blocking */
      }
    },
    [myPlanOwnerId],
  );

  const handleRenameMyPlanStage = useCallback(
    async (columnKey: string, newTitle: string, newColor: string) => {
      try {
        const updated = await tasksApi.updateStage(columnKey, { title: newTitle, color: newColor });
        setMyPlanStages((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } catch {
        /* non-blocking */
      }
    },
    [],
  );

  const handleDeleteMyPlanStage = useCallback(
    async (columnKey: string) => {
      const prev = myPlanStages;
      setMyPlanStages((s) => s.filter((st) => st.id !== columnKey));
      try {
        await tasksApi.deleteStage(columnKey);
      } catch {
        setMyPlanStages(prev);
      }
    },
    [myPlanStages],
  );

  const buildDeadlineColumns = useCallback((): KanbanColumn<Task>[] => {
    return DEADLINE_COLUMNS_DEF.map((col) => ({
      key: col.key,
      label: col.label,
      color: col.color,
      hexColor: col.hexColor,
      items: viewTasks.filter((t) => getDeadlineColumn(t) === col.key),
    }));
  }, [viewTasks]);

  return {
    boardView,
    setBoardView,
    myPlanStages,
    quickCreateOpen,
    setQuickCreateOpen,
    defaultCreateDueDate,
    setDefaultCreateDueDate,
    handleAction,
    handleKanbanMove,
    handleKanbanReorder,
    handleMyPlanMove,
    handleMyPlanReorder,
    handleDeadlineMove,
    handleDeadlineReorder,
    handleAddTaskInColumn,
    handleAddMyPlanStage,
    handleRenameMyPlanStage,
    handleDeleteMyPlanStage,
    buildWorkspaceKanbanColumns: () => buildWorkspaceKanbanColumns(viewTasks),
    buildWorkspacePlanningColumns: () => buildWorkspacePlanningColumns(viewTasks),
    buildMyPlanColumns: () => buildMyPlanColumns(myPlanBoardTasks, myPlanStagesForView),
    handlePlanningMove,
    buildDeadlineColumns,
    viewTasks,
  };
}
