import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import type { KanbanColumn } from '@/components/shared';
import {
  DEADLINE_COLUMNS_DEF,
  KANBAN_STATUS_MAP,
  getDeadlineColumn,
  getDueDateForDeadlineColumn,
  buildWorkspaceKanbanColumns,
  buildMyPlanColumns,
} from '@/features/tasks/task-board';
import type { TaskBoardAction } from '@/features/tasks/task-board';
import { tasksApi, type Task, type TaskBoardStage } from '@/lib/api/tasks';

export type WorkspaceBoardView = 'deadline' | 'my-plan' | 'kanban';

export function useWorkspaceRuntimeBoard(
  tasks: Task[],
  setTasks: Dispatch<SetStateAction<Task[]>>,
) {
  const [boardView, setBoardView] = useState<WorkspaceBoardView>('kanban');
  const [myPlanStages, setMyPlanStages] = useState<TaskBoardStage[]>([]);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [defaultCreateDueDate, setDefaultCreateDueDate] = useState<string | null>(null);

  const fetchMyPlanStages = useCallback(async (ownerId: string) => {
    try {
      const stages = await tasksApi.getMyPlanStages(ownerId);
      setMyPlanStages(stages);
    } catch {
      /* non-blocking */
    }
  }, []);

  const handleAction = useCallback(
    async (taskId: string, action: TaskBoardAction) => {
      const updated = await tasksApi[action](taskId);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
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
        if (targetStatus === 'IN_PROGRESS' && (task.status === 'OPEN' || task.status === 'NEW')) {
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
      setDefaultCreateDueDate(
        boardView === 'deadline' ? (getDueDateForDeadlineColumn(columnKey) ?? null) : null,
      );
      setQuickCreateOpen(true);
    },
    [boardView],
  );

  const handleAddMyPlanStage = useCallback(
    async (title: string, color: string, ownerId: string) => {
      try {
        const stage = await tasksApi.createStage({
          boardType: 'MY_PLAN',
          title,
          color,
          ownerId,
        });
        setMyPlanStages((prev) => [...prev, stage]);
      } catch {
        /* non-blocking */
      }
    },
    [],
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
      items: tasks.filter((t) => getDeadlineColumn(t) === col.key),
    }));
  }, [tasks]);

  return {
    boardView,
    setBoardView,
    myPlanStages,
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
    buildWorkspaceKanbanColumns: () => buildWorkspaceKanbanColumns(tasks),
    buildMyPlanColumns: () => buildMyPlanColumns(tasks, myPlanStages),
    buildDeadlineColumns,
  };
}
