'use client';

import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { TASK_STATUSES, TASK_PRIORITIES } from '@/features/tasks/constants/tasks';
import { taskMatchesTaskBoardScope } from '@/features/tasks/constants/task-board-lifecycle';
import {
  BOARD_LIFECYCLE_SCOPE_OPTIONS,
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
  resolveBoardLifecycleScope,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import { TASK_OPEN_QUERY } from '@/features/tasks/constants/task-open-query';
import {
  applyTaskToKanbanColumn,
  KANBAN_STATUS_MAP,
  getDueDateForDeadlineColumn,
  reorderTasksInColumn,
  taskMatchesDeadlineColumn,
  taskMatchesKanbanStatusColumn,
  taskMatchesMyPlanColumn,
} from '@/features/tasks/task-board';
import { TasksListKanbanViews } from '@/features/tasks/tasks-list-kanban-views';
import type { TasksListBoardView } from '@/features/tasks/tasks-list-types';
import { tasksApi, type Task, type TaskBoardStage, type TaskStats } from '@/lib/api/tasks';
import { useTasksScopeStatsCsvExport } from '@/features/tasks/use-tasks-scope-stats-csv-export';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';

export type { TasksListBoardView } from '@/features/tasks/tasks-list-types';

const FILTER_CONFIGS = [
  {
    key: 'boardScope',
    label: 'Status',
    includeAllOption: false,
    defaultOptionValue: DEFAULT_BOARD_LIFECYCLE_SCOPE,
    options: BOARD_LIFECYCLE_SCOPE_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  },
  {
    key: 'status',
    label: 'Stage',
    options: TASK_STATUSES.map((s) => ({ value: s.value, label: s.label })),
  },
  {
    key: 'priority',
    label: 'Priority',
    options: TASK_PRIORITIES.map((p) => ({ value: p.value, label: p.label })),
  },
];

export function useTasksListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openTaskId = searchParams.get(TASK_OPEN_QUERY)?.trim() || null;

  const { creatorId, creatorReady } = useTaskCreatorId();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [boardView, setBoardView] = useState<TasksListBoardView>('kanban');
  const [myPlanStages, setMyPlanStages] = useState<TaskBoardStage[]>([]);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [defaultCreateDueDate, setDefaultCreateDueDate] = useState<string | null>(null);
  const [quickCreateColumnKey, setQuickCreateColumnKey] = useState<string | null>(null);

  const stripTaskOpenFromUrl = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    if (!p.has(TASK_OPEN_QUERY)) return;
    p.delete(TASK_OPEN_QUERY);
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [router, pathname, searchParams]);

  const handleTaskSheetOpenChange = useCallback(
    (open: boolean) => {
      if (!open) stripTaskOpenFromUrl();
    },
    [stripTaskOpenFromUrl],
  );

  const { handleExportScopeStatsCsv } = useTasksScopeStatsCsvExport(stats);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      if (!creatorReady) {
        setError(null);
        return;
      }
      if (!creatorId) {
        setTasks([]);
        setStats(null);
        setError(null);
        return;
      }

      const resp = await tasksApi.getAll({
        pageSize: 200,
        search: search || undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
        hasParent: false,
        involvesEmployeeId: creatorId,
      });
      setTasks(resp.items);
      setError(null);
      try {
        setStats(await tasksApi.getStats({ involvesEmployeeId: creatorId }));
      } catch {
        setStats(null);
      }
    } catch {
      setError('Tasks could not be loaded. Check your connection and try again.');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [search, filters, creatorId, creatorReady]);

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
  }, [fetchTasks]);

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

  const handleTaskClick = useCallback(
    (task: Task) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set(TASK_OPEN_QUERY, task.id);
      const qs = p.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  const handleTaskUpdate = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleTaskDelete = useCallback(
    (taskId: string) => {
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      if (openTaskId === taskId) stripTaskOpenFromUrl();
    },
    [openTaskId, stripTaskOpenFromUrl],
  );

  const handleTaskCreated = async (task: Task) => {
    let next = task;
    if (quickCreateColumnKey) {
      try {
        next = await applyTaskToKanbanColumn(task, quickCreateColumnKey, boardView);
      } catch {
        next = task;
      }
    }
    setTasks((prev) => [next, ...prev.filter((t) => t.id !== next.id)]);
    setQuickCreateColumnKey(null);
  };

  const handleKanbanReorder = (taskId: string, columnKey: string, toIndex: number) => {
    setTasks((prev) =>
      reorderTasksInColumn(prev, taskId, toIndex, (task) =>
        taskMatchesKanbanStatusColumn(task, columnKey),
      ),
    );
  };

  const handleDeadlineReorder = (taskId: string, columnKey: string, toIndex: number) => {
    setTasks((prev) =>
      reorderTasksInColumn(prev, taskId, toIndex, (task) =>
        taskMatchesDeadlineColumn(task, columnKey),
      ),
    );
  };

  const handleMyPlanReorder = (taskId: string, columnKey: string, toIndex: number) => {
    setTasks((prev) =>
      reorderTasksInColumn(prev, taskId, toIndex, (task) =>
        taskMatchesMyPlanColumn(task, columnKey),
      ),
    );
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
    setQuickCreateColumnKey(columnKey);
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

  const boardScope = resolveBoardLifecycleScope(filters.boardScope);
  const hasStatusFilter = Boolean(filters.status) && filters.status !== 'all';

  const displayTasks = useMemo(() => {
    if (hasStatusFilter) return tasks;
    return tasks.filter((task) => taskMatchesTaskBoardScope(task.status, boardScope));
  }, [tasks, boardScope, hasStatusFilter]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      if (key === 'boardScope' && value === DEFAULT_BOARD_LIFECYCLE_SCOPE) {
        const next = { ...prev };
        delete next.boardScope;
        return next;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

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
      boardScope: boardScope as BoardLifecycleScope,
      tasks: displayTasks,
      myPlanStages,
      onTaskAction: handleAction,
      onTaskClick: handleTaskClick,
      onKanbanMove: handleKanbanMove,
      onKanbanReorder: handleKanbanReorder,
      onMyPlanMove: handleMyPlanMove,
      onMyPlanReorder: handleMyPlanReorder,
      onDeadlineMove: handleDeadlineMove,
      onDeadlineReorder: handleDeadlineReorder,
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
    boardScope: boardScope as BoardLifecycleScope,
    displayTasks,
    filters,
    setFilters,
    handleFilterChange,
    handleClearFilters,
    boardView,
    setBoardView,
    fetchTasks,
    filterConfigs: FILTER_CONFIGS,
    handleExportScopeStatsCsv,
    selectedTaskId: openTaskId,
    sheetOpen: Boolean(openTaskId),
    handleTaskSheetOpenChange,
    quickCreateOpen,
    setQuickCreateOpen,
    defaultCreateDueDate,
    setDefaultCreateDueDate,
    setQuickCreateColumnKey,
    handleTaskUpdate,
    handleTaskDelete,
    handleTaskCreated,
    renderBoard,
  };
}
