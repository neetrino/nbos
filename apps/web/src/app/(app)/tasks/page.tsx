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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, FilterBar, EmptyState, StatusBadge } from '@/components/shared';
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  getTaskStatus,
  getTaskPriority,
} from '@/features/tasks/constants/tasks';
import { tasksApi, type Task, type TaskBoardStage } from '@/lib/api/tasks';

type BoardView = 'deadline' | 'my-plan' | 'kanban';

const DEADLINE_COLUMNS = [
  { key: 'overdue', label: 'Overdue', color: '#EF4444' },
  { key: 'today', label: 'Today', color: '#F59E0B' },
  { key: 'this-week', label: 'This Week', color: '#3B82F6' },
  { key: 'next-week', label: 'Next Week', color: '#8B5CF6' },
  { key: 'later', label: '2+ Weeks', color: '#6B7280' },
  { key: 'no-date', label: 'No Due Date', color: '#9CA3AF' },
  { key: 'done', label: 'Completed', color: '#10B981' },
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [boardView, setBoardView] = useState<BoardView>('kanban');
  const [kanbanStages, setKanbanStages] = useState<TaskBoardStage[]>([]);

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
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  const fetchStages = useCallback(async () => {
    try {
      const stages = await tasksApi.getKanbanStages();
      setKanbanStages(stages);
    } catch {
      /* handled */
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchStages();
  }, [fetchTasks, fetchStages]);

  const handleAction = async (taskId: string, action: 'start' | 'complete' | 'reopen') => {
    try {
      const updated =
        action === 'start'
          ? await tasksApi.start(taskId)
          : action === 'complete'
            ? await tasksApi.complete(taskId)
            : await tasksApi.reopen(taskId);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      /* handled */
    }
  };

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

  const renderTaskCard = (task: Task) => {
    const priority = getTaskPriority(task.priority);
    const status = getTaskStatus(task.status);
    const checklistTotal = task.checklists.reduce((sum, cl) => sum + cl.items.length, 0);
    const checklistDone = task.checklists.reduce(
      (sum, cl) => sum + cl.items.filter((i) => i.checked).length,
      0,
    );

    return (
      <div
        key={task.id}
        className="border-border bg-card cursor-pointer space-y-2 rounded-xl border p-3 transition-shadow hover:shadow-sm"
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
                  handleAction(task.id, 'start');
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
                  handleAction(task.id, 'complete');
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
                  handleAction(task.id, 'reopen');
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
            Subtasks: {task.subtasks.filter((s) => s.status === 'DONE').length}/
            {task._count.subtasks}
          </div>
        )}
      </div>
    );
  };

  const renderBoard = () => {
    if (boardView === 'deadline') {
      return (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {DEADLINE_COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => getDeadlineColumn(t) === col.key);
            return (
              <div key={col.key} className="min-w-[260px] flex-shrink-0">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-sm font-medium">{col.label}</span>
                  <span className="text-muted-foreground text-xs">({colTasks.length})</span>
                </div>
                <div className="space-y-2">{colTasks.map(renderTaskCard)}</div>
              </div>
            );
          })}
        </div>
      );
    }

    if (boardView === 'kanban') {
      const stages =
        kanbanStages.length > 0
          ? kanbanStages
          : [
              { id: 'new', title: 'New', color: '#3B82F6', sortOrder: 0 },
              { id: 'in-progress', title: 'In Progress', color: '#F59E0B', sortOrder: 1 },
              { id: 'done', title: 'Done', color: '#10B981', sortOrder: 2 },
            ];

      const statusMap: Record<string, string> = {
        New: 'NEW',
        'In Progress': 'IN_PROGRESS',
        Done: 'DONE',
      };

      return (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageStatus =
              statusMap[stage.title] ?? stage.title.toUpperCase().replace(/ /g, '_');
            const stageTasks = tasks.filter(
              (t) => t.kanbanStageId === stage.id || t.status === stageStatus,
            );
            return (
              <div key={stage.id} className="min-w-[260px] flex-shrink-0">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-sm font-medium">{stage.title}</span>
                  <span className="text-muted-foreground text-xs">({stageTasks.length})</span>
                </div>
                <div className="space-y-2">{stageTasks.map(renderTaskCard)}</div>
              </div>
            );
          })}
        </div>
      );
    }

    // my-plan — simplified for now
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        <div className="min-w-[260px] flex-shrink-0">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-sm font-medium">My Tasks</span>
            <span className="text-muted-foreground text-xs">({tasks.length})</span>
          </div>
          <div className="space-y-2">{tasks.map(renderTaskCard)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Tasks" description={`${tasks.length} tasks`}>
        <Button variant="outline" size="icon" onClick={fetchTasks}>
          <RefreshCcw size={16} />
        </Button>
        <div className="border-border flex rounded-lg border">
          <Button
            variant={boardView === 'deadline' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setBoardView('deadline')}
            className="gap-1 rounded-r-none text-xs"
          >
            <Clock size={14} />
            Deadline
          </Button>
          <Button
            variant={boardView === 'my-plan' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setBoardView('my-plan')}
            className="gap-1 rounded-none text-xs"
          >
            <User size={14} />
            My Plan
          </Button>
          <Button
            variant={boardView === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setBoardView('kanban')}
            className="gap-1 rounded-l-none text-xs"
          >
            <LayoutGrid size={14} />
            Board
          </Button>
        </div>
        <Button>
          <Plus size={16} />
          New Task
        </Button>
      </PageHeader>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tasks..."
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onClearFilters={() => setFilters({})}
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Create your first task to get started"
          action={
            <Button>
              <Plus size={16} /> Create First Task
            </Button>
          }
        />
      ) : (
        renderBoard()
      )}
    </div>
  );
}
