'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  RefreshCcw,
  CheckSquare,
  LayoutGrid,
  List,
  User,
  Calendar,
  FolderKanban,
  Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { PageHeader, FilterBar, EmptyState, StatusBadge, KanbanBoard } from '@/components/shared';
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  getTaskStatus,
  getTaskPriority,
} from '@/features/tasks/constants/tasks';
import { api } from '@/lib/api';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: string | null;
  createdAt: string;
  assignee: { id: string; firstName: string; lastName: string } | null;
  creator: { id: string; firstName: string; lastName: string } | null;
  project: { id: string; name: string } | null;
}

type ViewMode = 'kanban' | 'list';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<ViewMode>('kanban');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get('/api/tasks', {
        params: {
          pageSize: 200,
          search: search || undefined,
          status: filters.status && filters.status !== 'all' ? filters.status : undefined,
          priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
        },
      });
      setTasks(resp.data.items ?? resp.data ?? []);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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

  const kanbanColumns = TASK_STATUSES.filter((s) => s.value !== 'CANCELLED').map((status) => ({
    key: status.value,
    label: status.label,
    color: status.color,
    items: tasks.filter((t) => t.status === status.value),
  }));

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Tasks" description={`${tasks.length} tasks`}>
        <Button variant="outline" size="icon" onClick={fetchTasks}>
          <RefreshCcw size={16} />
        </Button>
        <div className="border-border flex rounded-lg border">
          <Button
            variant={view === 'kanban' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setView('kanban')}
            className="rounded-r-none"
          >
            <LayoutGrid size={14} />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setView('list')}
            className="rounded-l-none"
          >
            <List size={14} />
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
      ) : view === 'kanban' ? (
        <KanbanBoard
          columns={kanbanColumns}
          getItemId={(t: Task) => t.id}
          renderCard={(task: Task) => {
            const priority = getTaskPriority(task.priority);
            return (
              <div className="border-border bg-card cursor-pointer space-y-2 rounded-xl border p-3 transition-shadow hover:shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm leading-tight font-medium">{task.title}</p>
                  {priority && <Flag size={12} className={priority.color} />}
                </div>
                {task.project && (
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <FolderKanban size={10} />
                    {task.project.name}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  {task.assignee && (
                    <div className="flex items-center gap-1">
                      <div className="bg-accent/20 text-accent flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold">
                        {task.assignee.firstName[0]}
                        {task.assignee.lastName[0]}
                      </div>
                    </div>
                  )}
                  {task.deadline && (
                    <span className="text-muted-foreground text-[10px]">
                      {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          }}
        />
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const status = getTaskStatus(task.status);
                const priority = getTaskPriority(task.priority);
                return (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      {status && <StatusBadge label={status.label} variant={status.variant} />}
                    </TableCell>
                    <TableCell>
                      {priority && (
                        <StatusBadge label={priority.label} variant={priority.variant} />
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {task.project?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
