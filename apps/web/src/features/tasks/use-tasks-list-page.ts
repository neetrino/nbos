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
import { useTaskBoardMutations } from '@/features/tasks/task-board';
import { TasksListKanbanViews } from '@/features/tasks/tasks-list-kanban-views';
import type { TasksListBoardView } from '@/features/tasks/tasks-list-types';
import { tasksApi, type Task, type TaskBoardStage, type TaskStats } from '@/lib/api/tasks';
import { TASK_LIST_GLOBAL_PAGE_SIZE } from '@/features/tasks/constants/task-list-pagination';
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
    label: 'Urgency',
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
  const [taskMeta, setTaskMeta] = useState<{
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const boardMutations = useTaskBoardMutations({
    tasks,
    setTasks,
    boardView,
    quickCreateColumnKey,
    setQuickCreateColumnKey,
    setQuickCreateOpen,
    setDefaultCreateDueDate,
    myPlanOwnerId: creatorId,
    myPlanStages,
    setMyPlanStages,
  });

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
        pageSize: TASK_LIST_GLOBAL_PAGE_SIZE,
        sortBy: 'workspaceSortOrder',
        sortOrder: 'asc',
        search: search || undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
        hasParent: false,
        involvesEmployeeId: creatorId,
      });
      setTasks(resp.items);
      setTaskMeta(resp.meta);
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

  const loadMoreTasks = useCallback(async () => {
    if (!creatorId || !taskMeta || taskMeta.page >= taskMeta.totalPages) return;
    setLoadingMore(true);
    try {
      const resp = await tasksApi.getAll({
        page: taskMeta.page + 1,
        pageSize: taskMeta.pageSize,
        sortBy: 'workspaceSortOrder',
        sortOrder: 'asc',
        search: search || undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
        hasParent: false,
        involvesEmployeeId: creatorId,
      });
      setTasks((prev) => {
        const seen = new Set(prev.map((task) => task.id));
        const appended = resp.items.filter((task) => !seen.has(task.id));
        return [...prev, ...appended];
      });
      setTaskMeta(resp.meta);
    } finally {
      setLoadingMore(false);
    }
  }, [creatorId, taskMeta, search, filters]);

  const handleAction = async (taskId: string, action: 'start' | 'complete' | 'reopen') => {
    try {
      await boardMutations.handleAction(taskId, action);
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

  const handleTaskCreated = boardMutations.handleQuickCreateTask;

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

  const renderBoard = () =>
    createElement(TasksListKanbanViews, {
      boardView,
      boardScope: boardScope as BoardLifecycleScope,
      tasks: displayTasks,
      myPlanStages,
      onTaskAction: handleAction,
      onTaskClick: handleTaskClick,
      onKanbanMove: boardMutations.handleKanbanMove,
      onKanbanReorder: boardMutations.handleKanbanReorder,
      onMyPlanMove: boardMutations.handleMyPlanMove,
      onMyPlanReorder: boardMutations.handleMyPlanReorder,
      onDeadlineMove: boardMutations.handleDeadlineMove,
      onDeadlineReorder: boardMutations.handleDeadlineReorder,
      onAddTaskInColumn: boardMutations.handleAddTaskInColumn,
      onAddMyPlanStage: boardMutations.handleAddMyPlanStage,
      onRenameMyPlanStage: boardMutations.handleRenameMyPlanStage,
      onDeleteMyPlanStage: boardMutations.handleDeleteMyPlanStage,
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
    taskMeta,
    loadMoreTasks,
    loadingMore,
    renderBoard,
  };
}
