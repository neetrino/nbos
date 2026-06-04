'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import {
  applyTaskToKanbanColumn,
  getDueDateForDeadlineColumn,
  KANBAN_STATUS_MAP,
  persistColumnTaskReorder,
  reorderTasksInColumn,
  taskMatchesDeadlineColumn,
  taskMatchesKanbanStatusColumn,
  taskMatchesMyPlanColumn,
} from '@/features/tasks/task-board';
import type { TaskBoardAction } from '@/features/tasks/task-board';
import { tasksApi, type Task, type TaskBoardStage } from '@/lib/api/tasks';

export type TaskBoardViewMode = 'deadline' | 'my-plan' | 'kanban' | 'list' | 'planning';

export type UseTaskBoardMutationsParams = {
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  boardView: TaskBoardViewMode;
  quickCreateColumnKey: string | null;
  setQuickCreateColumnKey: (key: string | null) => void;
  setQuickCreateOpen?: (open: boolean) => void;
  setDefaultCreateDueDate?: (date: string | null) => void;
  myPlanOwnerId?: string | null;
  myPlanStages?: TaskBoardStage[];
  setMyPlanStages?: Dispatch<SetStateAction<TaskBoardStage[]>>;
};

export function useTaskBoardMutations({
  tasks,
  setTasks,
  boardView,
  quickCreateColumnKey,
  setQuickCreateColumnKey,
  setQuickCreateOpen,
  setDefaultCreateDueDate,
  myPlanOwnerId = null,
  myPlanStages = [],
  setMyPlanStages,
}: UseTaskBoardMutationsParams) {
  const handleAction = useCallback(
    async (taskId: string, action: TaskBoardAction) => {
      const updated = await tasksApi[action](taskId);
      setTasks((prev) => prev.map((task) => (task.id === updated.id ? updated : task)));
    },
    [setTasks],
  );

  const handleKanbanReorder = useCallback(
    (taskId: string, columnKey: string, toIndex: number) => {
      persistColumnTaskReorder({
        tasks,
        setTasks,
        taskId,
        toIndex,
        isInColumn: (task) => taskMatchesKanbanStatusColumn(task, columnKey),
        scope: 'workspace',
      });
    },
    [tasks, setTasks],
  );

  const handleMyPlanReorder = useCallback(
    (taskId: string, columnKey: string, toIndex: number) => {
      persistColumnTaskReorder({
        tasks,
        setTasks,
        taskId,
        toIndex,
        isInColumn: (task) => taskMatchesMyPlanColumn(task, columnKey),
        scope: 'my-plan',
      });
    },
    [tasks, setTasks],
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

  const handleKanbanMove = useCallback(
    async (taskId: string, _from: string, toColumn: string) => {
      const task = tasks.find((item) => item.id === taskId);
      if (!task) return;

      const targetStatus = KANBAN_STATUS_MAP[toColumn] ?? toColumn.toUpperCase().replace(/ /g, '_');
      const normalizedCurrent =
        task.status === 'NEW' && targetStatus === 'OPEN' ? 'OPEN' : task.status;
      if (normalizedCurrent === targetStatus) return;

      const previousTasks = tasks;
      setTasks((prev) =>
        prev.map((item) => (item.id === taskId ? { ...item, status: targetStatus } : item)),
      );

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
        setTasks(previousTasks);
      }
    },
    [tasks, setTasks],
  );

  const handleMyPlanMove = useCallback(
    async (taskId: string, _from: string, toStageId: string) => {
      const previousTasks = tasks;
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, myPlanStageId: toStageId } : task)),
      );

      try {
        await tasksApi.update(taskId, { myPlanStageId: toStageId });
      } catch {
        setTasks(previousTasks);
      }
    },
    [tasks, setTasks],
  );

  const handleDeadlineMove = useCallback(
    async (taskId: string, _from: string, toColumnKey: string) => {
      const task = tasks.find((item) => item.id === taskId);
      if (!task) return;

      const previousTasks = tasks;

      if (toColumnKey === 'done') {
        setTasks((prev) =>
          prev.map((item) =>
            item.id === taskId ? { ...item, status: 'COMPLETED' as const } : item,
          ),
        );
        try {
          await tasksApi.complete(taskId);
        } catch {
          setTasks(previousTasks);
        }
        return;
      }

      const newDueDate = getDueDateForDeadlineColumn(toColumnKey);
      setTasks((prev) =>
        prev.map((item) =>
          item.id === taskId
            ? {
                ...item,
                dueDate: newDueDate,
                status:
                  task.status === 'COMPLETED' || task.status === 'DONE'
                    ? ('OPEN' as const)
                    : item.status,
              }
            : item,
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
        setTasks(previousTasks);
      }
    },
    [tasks, setTasks],
  );

  const handleAddTaskInColumn = useCallback(
    (columnKey: string) => {
      setQuickCreateColumnKey(columnKey);
      const dueDate =
        boardView === 'deadline' ? (getDueDateForDeadlineColumn(columnKey) ?? null) : null;
      setDefaultCreateDueDate?.(dueDate);
      setQuickCreateOpen?.(true);
    },
    [boardView, setDefaultCreateDueDate, setQuickCreateColumnKey, setQuickCreateOpen],
  );

  const handleQuickCreateTask = useCallback(
    async (task: Task) => {
      let next = task;
      if (quickCreateColumnKey) {
        try {
          next = await applyTaskToKanbanColumn(task, quickCreateColumnKey, boardView);
        } catch {
          next = task;
        }
      }
      setTasks((prev) => [next, ...prev.filter((item) => item.id !== next.id)]);
      setQuickCreateColumnKey(null);
    },
    [boardView, quickCreateColumnKey, setQuickCreateColumnKey, setTasks],
  );

  const handleAddMyPlanStage = useCallback(
    async (title: string, color: string) => {
      if (!myPlanOwnerId || !setMyPlanStages) return;
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
    [myPlanOwnerId, setMyPlanStages],
  );

  const handleRenameMyPlanStage = useCallback(
    async (columnKey: string, newTitle: string, newColor: string) => {
      if (!setMyPlanStages) return;
      try {
        const updated = await tasksApi.updateStage(columnKey, {
          title: newTitle,
          color: newColor,
        });
        setMyPlanStages((prev) => prev.map((stage) => (stage.id === updated.id ? updated : stage)));
      } catch {
        /* non-blocking */
      }
    },
    [setMyPlanStages],
  );

  const handleDeleteMyPlanStage = useCallback(
    async (columnKey: string) => {
      if (!setMyPlanStages) return;
      const previousStages = myPlanStages;
      setMyPlanStages((prev) => prev.filter((stage) => stage.id !== columnKey));
      try {
        await tasksApi.deleteStage(columnKey);
      } catch {
        setMyPlanStages(previousStages);
      }
    },
    [myPlanStages, setMyPlanStages],
  );

  return {
    handleAction,
    handleKanbanMove,
    handleKanbanReorder,
    handleMyPlanMove,
    handleMyPlanReorder,
    handleDeadlineMove,
    handleDeadlineReorder,
    handleAddTaskInColumn,
    handleQuickCreateTask,
    handleAddMyPlanStage,
    handleRenameMyPlanStage,
    handleDeleteMyPlanStage,
  };
}
