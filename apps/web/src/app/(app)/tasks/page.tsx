'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  RefreshCcw,
  CheckSquare,
  Clock,
  User,
  LayoutGrid,
  Flag,
  FolderKanban,
  Play,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  PageHeader,
  FilterBar,
  KanbanBoard,
  EmptyState,
  ErrorState,
  LoadingState,
  type KanbanColumn,
} from '@/components/shared';
import { TASK_STATUSES, TASK_PRIORITIES, getTaskPriority } from '@/features/tasks/constants/tasks';
import { tasksApi, type Task, type TaskBoardStage } from '@/lib/api/tasks';
import { TaskSheet } from '@/features/tasks/components/TaskSheet';
import { QuickCreateTaskDialog } from '@/features/tasks/components/QuickCreateTaskDialog';

type BoardView = 'deadline' | 'my-plan' | 'kanban';

const DEADLINE_COLUMNS_DEF = [
  { key: 'overdue', label: 'Overdue', color: '#EF4444', hexColor: '#EF4444' },
  { key: 'today', label: 'Today', color: '#F59E0B', hexColor: '#F59E0B' },
  { key: 'this-week', label: 'This Week', color: '#3B82F6', hexColor: '#3B82F6' },
  { key: 'next-week', label: 'Next Week', color: '#8B5CF6', hexColor: '#8B5CF6' },
  { key: 'later', label: '2+ Weeks', color: '#6B7280', hexColor: '#6B7280' },
  { key: 'no-date', label: 'No Due Date', color: '#9CA3AF', hexColor: '#9CA3AF' },
  { key: 'done', label: 'Completed', color: '#10B981', hexColor: '#10B981' },
];

function getDeadlineColumn(task: Task): string {
  if (task.status === 'DONE') return 'done';
  if (!task.dueDate) return 'no-date';

  const now = new Date();
  const due = new Date(task.dueDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.floor((dueDay.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 7) return 'this-week';
  if (diffDays <= 14) return 'next-week';
  return 'later';
}

/** Возвращает дату для столбца Deadline (или null для no-date). Границы: today=0, this-week=1..7, next-week=8..14, later=15+. */
function getDueDateForDeadlineColumn(columnKey: string): string | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (columnKey) {
    case 'overdue': {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      return d.toISOString();
    }
    case 'today':
      return today.toISOString();
    case 'this-week': {
      const d = new Date(today);
      d.setDate(d.getDate() + 3);
      return d.toISOString();
    }
    case 'next-week': {
      const d = new Date(today);
      d.setDate(d.getDate() + 8);
      return d.toISOString();
    }
    case 'later': {
      const d = new Date(today);
      d.setDate(d.getDate() + 15);
      return d.toISOString();
    }
    case 'no-date':
      return null;
    default:
      return null;
  }
}

const KANBAN_STATUS_MAP: Record<string, string> = {
  New: 'NEW',
  'In Progress': 'IN_PROGRESS',
  Done: 'DONE',
};

/* ─── Task mini-card ─── */
function TaskMiniCard({
  task,
  onAction,
  onClick,
}: {
  task: Task;
  onAction: (taskId: string, action: 'start' | 'complete' | 'reopen') => void;
  onClick: (task: Task) => void;
}) {
  const priority = getTaskPriority(task.priority);
  const checklistTotal = task.checklists.reduce((sum, cl) => sum + cl.items.length, 0);
  const checklistDone = task.checklists.reduce(
    (sum, cl) => sum + cl.items.filter((i) => i.checked).length,
    0,
  );

  return (
    <div
      className="border-border bg-card space-y-2 rounded-xl border p-3 transition-shadow hover:shadow-md"
      onClick={() => onClick(task)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm leading-tight font-medium">{task.title}</p>
        {priority && <Flag size={12} className={priority.color} />}
      </div>

      {task.links.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.links.map((link) => (
            <span
              key={link.id}
              className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]"
            >
              <FolderKanban size={9} />
              {link.entityType}
            </span>
          ))}
        </div>
      )}

      {checklistTotal > 0 && (
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <CheckSquare size={10} />
          {checklistDone}/{checklistTotal}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {task.assignee && (
            <div className="bg-accent/20 text-accent flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold">
              {task.assignee.firstName[0]}
              {task.assignee.lastName[0]}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {task.status === 'NEW' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(task.id, 'start');
              }}
              className="hover:bg-muted rounded p-0.5"
              title="Start"
            >
              <Play size={12} className="text-blue-500" />
            </button>
          )}
          {task.status === 'IN_PROGRESS' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(task.id, 'complete');
              }}
              className="hover:bg-muted rounded p-0.5"
              title="Complete"
            >
              <CheckCircle2 size={12} className="text-green-500" />
            </button>
          )}
          {task.status === 'DONE' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(task.id, 'reopen');
              }}
              className="hover:bg-muted rounded p-0.5"
              title="Reopen"
            >
              <RotateCcw size={12} className="text-amber-500" />
            </button>
          )}

          {task.dueDate && (
            <span
              className={`text-[10px] ${getDeadlineColumn(task) === 'overdue' ? 'font-semibold text-red-500' : 'text-muted-foreground'}`}
            >
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {task._count.subtasks > 0 && (
        <div className="text-muted-foreground flex items-center gap-1 text-[10px]">
          Subtasks: {task.subtasks.filter((s) => s.status === 'DONE').length}/{task._count.subtasks}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ─── */
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [boardView, setBoardView] = useState<BoardView>('kanban');
  const [kanbanStages, setKanbanStages] = useState<TaskBoardStage[]>([]);
  const [myPlanStages, setMyPlanStages] = useState<TaskBoardStage[]>([]);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [defaultCreateDueDate, setDefaultCreateDueDate] = useState<string | null>(null);

  const CURRENT_USER_ID = 'current-user';

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
    } catch {
      setError('Tasks could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  const fetchKanbanStages = useCallback(async () => {
    try {
      const stages = await tasksApi.getKanbanStages();
      setKanbanStages(stages);
    } catch {
      /* handled */
    }
  }, []);

  const fetchMyPlanStages = useCallback(async () => {
    try {
      const stages = await tasksApi.getMyPlanStages(CURRENT_USER_ID);
      setMyPlanStages(stages);
    } catch {
      /* handled */
    }
  }, [CURRENT_USER_ID]);

  useEffect(() => {
    fetchTasks();
    fetchKanbanStages();
    fetchMyPlanStages();
  }, [fetchTasks, fetchKanbanStages, fetchMyPlanStages]);

  /* ─── Task actions ─── */
  const handleAction = async (taskId: string, action: 'start' | 'complete' | 'reopen') => {
    try {
      const updated = await tasksApi[action](taskId);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      /* handled */
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

  /* ─── Kanban move ─── */
  const handleKanbanMove = async (taskId: string, _from: string, toColumn: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const targetStatus = KANBAN_STATUS_MAP[toColumn] ?? toColumn.toUpperCase().replace(/ /g, '_');

    if (task.status === targetStatus) return;

    const prevTasks = tasks;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)));

    try {
      if (targetStatus === 'IN_PROGRESS' && task.status === 'NEW') {
        await tasksApi.start(taskId);
      } else if (targetStatus === 'DONE') {
        await tasksApi.complete(taskId);
      } else if (targetStatus === 'NEW' && task.status !== 'NEW') {
        await tasksApi.reopen(taskId);
      } else {
        await tasksApi.update(taskId, { status: targetStatus });
      }
    } catch {
      setTasks(prevTasks);
    }
  };

  /* ─── My Plan move (move between user stages) ─── */
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

  /* ─── Deadline move: update due date (or complete when dropping on "done") ─── */
  const handleDeadlineMove = async (taskId: string, _from: string, toColumnKey: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const prevTasks = tasks;

    if (toColumnKey === 'done') {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'DONE' as const } : t)),
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
              status: task.status === 'DONE' ? ('NEW' as const) : t.status,
            }
          : t,
      ),
    );

    try {
      const updates: Record<string, unknown> = { dueDate: newDueDate };
      if (task.status === 'DONE') {
        await tasksApi.reopen(taskId);
        await tasksApi.update(taskId, updates);
      } else {
        await tasksApi.update(taskId, updates);
      }
    } catch {
      setTasks(prevTasks);
    }
  };

  /* ─── My Plan stage management ─── */
  const handleAddMyPlanStage = async (title: string, color: string) => {
    try {
      const stage = await tasksApi.createStage({
        boardType: 'MY_PLAN',
        title,
        color,
        ownerId: CURRENT_USER_ID,
      });
      setMyPlanStages((prev) => [...prev, stage]);
    } catch {
      /* handled */
    }
  };

  const handleRenameMyPlanStage = async (columnKey: string, newTitle: string, newColor: string) => {
    try {
      const updated = await tasksApi.updateStage(columnKey, { title: newTitle, color: newColor });
      setMyPlanStages((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch {
      /* handled */
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

  /* ─── Build columns ─── */
  const filterConfigs = [
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

  const buildKanbanColumns = (): KanbanColumn<Task>[] => {
    const fallback = [
      { id: 'New', title: 'New', color: '#3B82F6', sortOrder: 0 },
      { id: 'In Progress', title: 'In Progress', color: '#F59E0B', sortOrder: 1 },
      { id: 'Done', title: 'Done', color: '#10B981', sortOrder: 2 },
    ];
    const stages = kanbanStages.length > 0 ? kanbanStages : fallback;

    return stages.map((stage) => {
      const stageStatus =
        KANBAN_STATUS_MAP[stage.title] ?? stage.title.toUpperCase().replace(/ /g, '_');
      return {
        key: stage.title,
        label: stage.title,
        color: stage.color,
        hexColor: stage.color,
        items: tasks.filter((t) => t.kanbanStageId === stage.id || t.status === stageStatus),
      };
    });
  };

  const buildMyPlanColumns = (): KanbanColumn<Task>[] => {
    if (myPlanStages.length === 0) {
      return [
        {
          key: '__unassigned',
          label: 'Unassigned',
          color: '#6B7280',
          hexColor: '#6B7280',
          items: tasks,
        },
      ];
    }

    const columns: KanbanColumn<Task>[] = myPlanStages.map((stage) => ({
      key: stage.id,
      label: stage.title,
      color: stage.color,
      hexColor: stage.color,
      items: tasks.filter((t) => t.myPlanStageId === stage.id),
    }));

    const assignedIds = new Set(myPlanStages.map((s) => s.id));
    const unassigned = tasks.filter((t) => !t.myPlanStageId || !assignedIds.has(t.myPlanStageId));
    if (unassigned.length > 0) {
      columns.unshift({
        key: '__unassigned',
        label: 'Unassigned',
        color: '#6B7280',
        hexColor: '#6B7280',
        items: unassigned,
        readonly: true,
      });
    }

    return columns;
  };

  const buildDeadlineColumns = (): KanbanColumn<Task>[] =>
    DEADLINE_COLUMNS_DEF.map((col) => ({
      key: col.key,
      label: col.label,
      color: col.color,
      hexColor: col.hexColor,
      items: tasks.filter((t) => getDeadlineColumn(t) === col.key),
    }));

  const renderCard = (task: Task) => (
    <TaskMiniCard task={task} onAction={handleAction} onClick={handleTaskClick} />
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
            columns={buildKanbanColumns()}
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

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="shrink-0">
        <PageHeader title="Tasks" description={`${tasks.length} tasks`}>
          <Button variant="outline" size="icon" onClick={fetchTasks}>
            <RefreshCcw size={16} />
          </Button>
          <div className="border-border bg-muted/50 flex rounded-lg border p-0.5">
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
          <Button onClick={() => setQuickCreateOpen(true)}>
            <Plus size={16} />
            New Task
          </Button>
        </PageHeader>
      </div>

      <div className="shrink-0">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search tasks..."
          filters={filterConfigs}
          filterValues={filters}
          onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          onClearFilters={() => setFilters({})}
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchTasks} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Create your first task to get started"
          action={
            <Button onClick={() => setQuickCreateOpen(true)}>
              <Plus size={16} /> Create First Task
            </Button>
          }
        />
      ) : (
        renderBoard()
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
        defaultDueDate={defaultCreateDueDate}
        onCreated={handleTaskCreated}
      />
    </div>
  );
}
