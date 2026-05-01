'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, LayoutGrid, List, Pencil, Plus, RefreshCcw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/shared';
import { QuickCreateTaskDialog } from '@/features/tasks/components/QuickCreateTaskDialog';
import { TaskSheet } from '@/features/tasks/components/TaskSheet';
import { getTaskPriority, getTaskStatus, TASK_STATUSES } from '@/features/tasks/constants/tasks';
import { tasksApi, type Task, type WorkSpace } from '@/lib/api/tasks';
import { EditWorkSpaceDialog } from './EditWorkSpaceDialog';
import {
  buildWorkSpaceContextHref,
  buildDefaultTaskLink,
  formatPlanningStatus,
  getWorkSpaceContextLabel,
  getWorkSpaceTypeLabel,
  getWorkSpaceTypeVariant,
} from './work-space-utils';

const CURRENT_USER_ID = 'current-user';
const PLANNING_STATUSES = ['UNPLANNED', 'BACKLOG', 'FUTURE_SPRINT', 'ACTIVE_SPRINT'] as const;

export function WorkSpaceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkSpace | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchWorkspace = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const [workspaceData, taskData] = await Promise.all([
        tasksApi.getWorkSpaceById(params.id),
        tasksApi.getAll({ workspaceId: params.id, pageSize: 100 }),
      ]);
      setWorkspace(workspaceData);
      setTasks(taskData.items);
      setError(null);
    } catch {
      setError('Work Space could not be loaded. Check the link and try again.');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const contextHref = workspace ? buildWorkSpaceContextHref(workspace) : null;
  const defaultLink = useMemo(() => buildDefaultTaskLink(workspace), [workspace]);

  const openTask = (task: Task) => {
    setSelectedTaskId(task.id);
    setSheetOpen(true);
  };

  const handleCreated = (task: Task) => {
    setTasks((current) => [task, ...current]);
  };

  const handleTaskUpdate = (task: Task) => {
    setTasks((current) => current.map((item) => (item.id === task.id ? task : item)));
  };

  const handleWorkspaceUpdate = (updated: WorkSpace) => {
    setWorkspace(updated);
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={fetchWorkspace} />;
  if (!workspace) return null;

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title={workspace.name} description={getWorkSpaceContextLabel(workspace)}>
        <Button variant="ghost" size="icon" onClick={() => router.push('/work-spaces')}>
          <ArrowLeft size={16} />
        </Button>
        <Button variant="outline" size="icon" onClick={fetchWorkspace} aria-label="Refresh">
          <RefreshCcw size={16} />
        </Button>
        {contextHref && (
          <Link href={contextHref} className={buttonVariants({ variant: 'outline' })}>
            Context <ArrowUpRight size={14} />
          </Link>
        )}
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil size={16} />
          Edit
        </Button>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          New Task
        </Button>
      </PageHeader>

      <WorkSpaceHeader workspace={workspace} taskCount={tasks.length} />

      <Tabs defaultValue="kanban" className="min-h-0 flex-1">
        <TabsList>
          <TabsTrigger value="kanban">
            <LayoutGrid size={14} /> Kanban
          </TabsTrigger>
          <TabsTrigger value="list">
            <List size={14} /> List
          </TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" className="mt-4">
          <KanbanView tasks={tasks} onOpenTask={openTask} />
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          <ListView tasks={tasks} onOpenTask={openTask} />
        </TabsContent>
        <TabsContent value="planning" className="mt-4">
          <PlanningView tasks={tasks} onOpenTask={openTask} />
        </TabsContent>
      </Tabs>

      <QuickCreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        creatorId={CURRENT_USER_ID}
        defaultWorkspaceId={workspace.id}
        defaultPlanningStatus={workspace.scrumEnabled ? 'BACKLOG' : 'UNPLANNED'}
        defaultLink={defaultLink ?? undefined}
        onCreated={handleCreated}
      />
      <EditWorkSpaceDialog
        workspace={workspace}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={handleWorkspaceUpdate}
      />
      <TaskSheet
        taskId={selectedTaskId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdate={handleTaskUpdate}
      />
    </div>
  );
}

function WorkSpaceHeader({ workspace, taskCount }: { workspace: WorkSpace; taskCount: number }) {
  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          label={getWorkSpaceTypeLabel(workspace.type)}
          variant={getWorkSpaceTypeVariant(workspace.type)}
        />
        <StatusBadge
          label={workspace.scrumEnabled ? 'Scrum-enabled' : 'Kanban'}
          variant={workspace.scrumEnabled ? 'blue' : 'gray'}
        />
        <StatusBadge label={`${taskCount} tasks`} variant="default" />
      </div>
      {workspace.description && (
        <p className="text-muted-foreground mt-3 text-sm">{workspace.description}</p>
      )}
    </div>
  );
}

function KanbanView({ tasks, onOpenTask }: TaskViewProps) {
  if (tasks.length === 0) return <NoTasksState />;
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {TASK_STATUSES.filter((status) => status.value !== 'CANCELLED').map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status.value);
        return (
          <section key={status.value} className="bg-muted/40 rounded-xl p-3">
            <div className="mb-3 flex items-center justify-between">
              <StatusBadge label={status.label} variant={status.variant} />
              <span className="text-muted-foreground text-xs">{columnTasks.length}</span>
            </div>
            <TaskCards tasks={columnTasks} onOpenTask={onOpenTask} />
          </section>
        );
      })}
    </div>
  );
}

function ListView({ tasks, onOpenTask }: TaskViewProps) {
  if (tasks.length === 0) return <NoTasksState />;
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} onOpenTask={onOpenTask} />
      ))}
    </div>
  );
}

function PlanningView({ tasks, onOpenTask }: TaskViewProps) {
  if (tasks.length === 0) return <NoTasksState />;
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {PLANNING_STATUSES.map((status) => (
        <section key={status} className="bg-muted/40 rounded-xl p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{formatPlanningStatus(status)}</h3>
            <span className="text-muted-foreground text-xs">
              {tasks.filter((task) => task.planningStatus === status).length}
            </span>
          </div>
          <TaskCards
            tasks={tasks.filter((task) => task.planningStatus === status)}
            onOpenTask={onOpenTask}
          />
        </section>
      ))}
    </div>
  );
}

interface TaskViewProps {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
}

function TaskCards({ tasks, onOpenTask }: TaskViewProps) {
  if (tasks.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-xs">Empty</p>
    );
  }
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onOpenTask={onOpenTask} />
      ))}
    </div>
  );
}

function TaskCard({ task, onOpenTask }: { task: Task; onOpenTask: (task: Task) => void }) {
  const priority = getTaskPriority(task.priority);
  return (
    <button
      type="button"
      onClick={() => onOpenTask(task)}
      className="bg-card hover:bg-muted/60 w-full rounded-lg border p-3 text-left transition-colors"
    >
      <p className="text-sm font-medium">{task.title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <TaskStatusBadge task={task} />
        {priority && <StatusBadge label={priority.label} variant={priority.variant} />}
      </div>
    </button>
  );
}

function TaskRow({ task, onOpenTask }: { task: Task; onOpenTask: (task: Task) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpenTask(task)}
      className="hover:bg-muted/50 grid w-full grid-cols-[1fr_auto_auto] gap-3 border-b p-3 text-left last:border-b-0"
    >
      <span className="font-medium">{task.title}</span>
      <TaskStatusBadge task={task} />
      <span className="text-muted-foreground text-sm">
        {formatPlanningStatus(task.planningStatus)}
      </span>
    </button>
  );
}

function TaskStatusBadge({ task }: { task: Task }) {
  const status = getTaskStatus(task.status);
  return (
    <StatusBadge label={status?.label ?? task.status} variant={status?.variant ?? 'default'} />
  );
}

function NoTasksState() {
  return (
    <EmptyState
      icon={List}
      title="No tasks in this Work Space"
      description="Create a task to start planning work here."
    />
  );
}
