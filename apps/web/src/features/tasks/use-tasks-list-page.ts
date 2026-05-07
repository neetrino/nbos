'use client';

import { createElement, useCallback, useEffect, useState } from 'react';
import { TASK_STATUSES, TASK_PRIORITIES } from '@/features/tasks/constants/tasks';
import { KANBAN_STATUS_MAP, getDueDateForDeadlineColumn } from '@/features/tasks/task-board';
import { TasksListKanbanViews } from '@/features/tasks/tasks-list-kanban-views';
import type { TasksListBoardView } from '@/features/tasks/tasks-list-types';
import { tasksApi, type Task, type TaskBoardStage, type TaskStats } from '@/lib/api/tasks';
import { useTasksScopeStatsCsvExport } from '@/features/tasks/use-tasks-scope-stats-csv-export';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';

export type { TasksListBoardView } from '@/features/tasks/tasks-list-types';

const FILTER_CONFIGS = [
  {
    key: 'status',
    label: 'Status',
    options: TASK_STATUSES.map((s) => ({ value: s.value, label: s.label })),
  },
  {
    key: 'priority',
    label: 'Priority',
    options: TASK_PRIORITIES.map((p) => ({ value: p.value, label: p.label })),
  },
];

export function useTasksListPage() {
  const { creatorId, creatorReady } = useTaskCreatorId();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [boardView, setBoardView] = useState<TasksListBoardView>('kanban');
  const [kanbanStages, setKanbanStages] = useState<TaskBoardStage[]>([]);
  const [myPlanStages, setMyPlanStages] = useState<TaskBoardStage[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [defaultCreateDueDate, setDefaultCreateDueDate] = useState<string | null>(null);

  const { handleExportScopeStatsCsv } = useTasksScopeStatsCsvExport(stats);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await tasksApi.getAll({
        pageSize: 200,
        search: search || undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
        hasParent: false,
      });
      setTasks(resp.items);
      setError(null);
      try {
        setStats(await tasksApi.getStats());
      } catch {
        setStats(null);
      }
    } catch {
      setError('Tasks could not be loaded. Check your connection and try again.');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  const fetchKanbanStages = useCallback(async () => {
    try {
      setKanbanStages(await tasksApi.getKanbanStages());
    } catch {
      /* non-blocking */
    }
  }, []);

  const fetchMyPlanStages = useCallback(async () => {
    if (!creatorId) {
      setMyPlanStages([]);
      return;
    }
    try {
      setMyPlanStages(await tasksApi.getMyPlanStages(creatorId));
    } catch {
      /* non-blocking */
    }
  }, [creatorId]);

  useEffect(() => {
    void fetchTasks();
    void fetchKanbanStages();
  }, [fetchTasks, fetchKanbanStages]);

  useEffect(() => {
    void fetchMyPlanStages();
  }, [fetchMyPlanStages]);

  const handleAction = async (taskId: string, action: 'start' | 'complete' | 'reopen') => {
    try {
      const updated = await tasksApi[action](taskId);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      /* non-blocking */
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    setSheetOpen(true);
  };

  const handleTaskUpdate = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleTaskCreated = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
  };

  const handleKanbanMove = async (taskId: string, _from: string, toColumn: string) => {
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
  };

  const handleMyPlanMove = async (taskId: string, _from: string, toStageId: string) => {
    const prevTasks = tasks;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, myPlanStageId: toStageId } : t)));

    try {
      await tasksApi.update(taskId, { myPlanStageId: toStageId });
    } catch {
      setTasks(prevTasks);
    }
  };

  const handleAddTaskInColumn = (columnKey: string) => {
    setDefaultCreateDueDate(
      boardView === 'deadline' ? (getDueDateForDeadlineColumn(columnKey) ?? null) : null,
    );
    setQuickCreateOpen(true);
  };

  const handleDeadlineMove = async (taskId: string, _from: string, toColumnKey: string) => {
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
  };

  const handleAddMyPlanStage = async (title: string, color: string) => {
    if (!creatorId) return;
    try {
      const stage = await tasksApi.createStage({
        boardType: 'MY_PLAN',
        title,
        color,
        ownerId: creatorId,
      });
      setMyPlanStages((prev) => [...prev, stage]);
    } catch {
      /* non-blocking */
    }
  };

  const handleRenameMyPlanStage = async (columnKey: string, newTitle: string, newColor: string) => {
    try {
      const updated = await tasksApi.updateStage(columnKey, { title: newTitle, color: newColor });
      setMyPlanStages((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch {
      /* non-blocking */
    }
  };

  const handleDeleteMyPlanStage = async (columnKey: string) => {
    const prev = myPlanStages;
    setMyPlanStages((s) => s.filter((st) => st.id !== columnKey));
    try {
      await tasksApi.deleteStage(columnKey);
    } catch {
      setMyPlanStages(prev);
    }
  };

  const renderBoard = () =>
    createElement(TasksListKanbanViews, {
      boardView,
      tasks,
      kanbanStages,
      myPlanStages,
      onTaskAction: handleAction,
      onTaskClick: handleTaskClick,
      onKanbanMove: handleKanbanMove,
      onMyPlanMove: handleMyPlanMove,
      onDeadlineMove: handleDeadlineMove,
      onAddTaskInColumn: handleAddTaskInColumn,
      onAddMyPlanStage: handleAddMyPlanStage,
      onRenameMyPlanStage: handleRenameMyPlanStage,
      onDeleteMyPlanStage: handleDeleteMyPlanStage,
    });

  return {
    creatorId,
    creatorReady,
    tasks,
    stats,
    loading,
    error,
    search,
    setSearch,
    filters,
    setFilters,
    boardView,
    setBoardView,
    fetchTasks,
    filterConfigs: FILTER_CONFIGS,
    handleExportScopeStatsCsv,
    selectedTaskId,
    sheetOpen,
    setSheetOpen,
    quickCreateOpen,
    setQuickCreateOpen,
    defaultCreateDueDate,
    setDefaultCreateDueDate,
    handleTaskUpdate,
    handleTaskCreated,
    renderBoard,
  };
}
