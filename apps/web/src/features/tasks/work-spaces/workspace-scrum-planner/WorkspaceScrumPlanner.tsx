'use client';

import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-errors';
import { tasksApi, type Task } from '@/lib/api/tasks';
import { fetchWorkspaceTaskPage } from '@/features/tasks/work-spaces/work-space-task-fetch';
import { workSpaceSprintsApi, type WorkSpaceSprint } from '@/lib/api/work-space-sprints';
import { groupTasksForScrumPlanner, sprintCompletionPercent } from '../workspace-scrum-groups';
import { WorkspaceScrumTaskRow } from './WorkspaceScrumTaskRow';
import { useScrumDropTarget } from './use-scrum-drop-target';
import { CreateWorkSpaceSprintDialog } from './CreateWorkSpaceSprintDialog';
import { CloseWorkSpaceSprintDialog } from './CloseWorkSpaceSprintDialog';
import { WorkspaceScrumBacklogQuickAdd } from './WorkspaceScrumBacklogQuickAdd';
export function WorkspaceScrumPlanner({
  workspaceId,
  tasks,
  sprints,
  setTasks,
  setSprints,
  onOpenTask,
  onAddBacklogTask,
  onBacklogTaskCreated,
  creatorId,
  creatorReady,
  refreshTasksFromServer,
}: {
  workspaceId: string;
  tasks: Task[];
  sprints: WorkSpaceSprint[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setSprints: Dispatch<SetStateAction<WorkSpaceSprint[]>>;
  onOpenTask: (task: Task) => void;
  onAddBacklogTask: () => void;
  onBacklogTaskCreated: (task: Task) => void;
  creatorId: string | null;
  creatorReady: boolean;
  refreshTasksFromServer?: () => Promise<void>;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [closeSprint, setCloseSprint] = useState<WorkSpaceSprint | null>(null);
  const [closedOpen, setClosedOpen] = useState(false);

  const grouped = useMemo(() => groupTasksForScrumPlanner(tasks, sprints), [tasks, sprints]);

  const applyServerTaskList = useCallback(
    async (taskList: Task[]) => {
      if (refreshTasksFromServer) {
        await refreshTasksFromServer();
        return;
      }
      setTasks(taskList);
    },
    [refreshTasksFromServer, setTasks],
  );

  const moveTask = useCallback(
    async (taskId: string, sprintId: string | null) => {
      const prev = tasks;
      setTasks((cur) =>
        cur.map((t) =>
          t.id === taskId
            ? {
                ...t,
                sprintId,
                planningStatus: sprintId
                  ? sprintId === grouped.active?.id
                    ? 'ACTIVE_SPRINT'
                    : 'FUTURE_SPRINT'
                  : 'BACKLOG',
              }
            : t,
        ),
      );
      try {
        const updated = await workSpaceSprintsApi.moveTask(workspaceId, taskId, sprintId);
        const full = await tasksApi.getById(updated.id);
        setTasks((cur) => cur.map((t) => (t.id === full.id ? full : t)));
        const nextSprints = await workSpaceSprintsApi.list(workspaceId);
        setSprints(nextSprints);
      } catch (caught) {
        setTasks(prev);
        toast.error(getApiErrorMessage(caught, 'Could not move task.'));
      }
    },
    [tasks, workspaceId, setTasks, setSprints, grouped.active?.id],
  );

  const backlogDrop = useScrumDropTarget((taskId) => void moveTask(taskId, null));

  const handleStart = async (sprintId: string) => {
    try {
      await workSpaceSprintsApi.start(workspaceId, sprintId);
      const [nextSprints, taskList] = await Promise.all([
        workSpaceSprintsApi.list(workspaceId),
        fetchWorkspaceTaskPage(workspaceId),
      ]);
      setSprints(nextSprints);
      await applyServerTaskList(taskList.items);
      toast.success('Sprint started.');
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not start sprint.'));
    }
  };

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      <section
        className="border-border bg-card/40 flex min-h-[420px] w-[min(100%,605px)] shrink-0 flex-col rounded-xl border p-3"
        {...backlogDrop}
      >
        <header className="mb-2 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Backlog</h3>
            <p className="text-muted-foreground text-xs">Tasks: {grouped.backlog.length}</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={onAddBacklogTask}>
            <Plus className="size-4" aria-hidden />
            More fields
          </Button>
        </header>
        <WorkspaceScrumBacklogQuickAdd
          workspaceId={workspaceId}
          creatorId={creatorId}
          creatorReady={creatorReady}
          onCreated={onBacklogTaskCreated}
        />
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {grouped.backlog.length === 0 ? (
            <p className="text-muted-foreground border-border rounded-lg border border-dashed p-4 text-center text-xs">
              Type a title above and press Enter, or drag tasks here.
            </p>
          ) : (
            grouped.backlog.map((task) => (
              <WorkspaceScrumTaskRow key={task.id} task={task} onOpen={onOpenTask} />
            ))
          )}
        </div>
      </section>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto">
        {grouped.active ? (
          <SprintBlock
            sprint={grouped.active}
            tasks={grouped.bySprint.get(grouped.active.id) ?? []}
            variant="active"
            onDropTask={(id) => void moveTask(id, grouped.active!.id)}
            onOpenTask={onOpenTask}
            onFinish={() => setCloseSprint(grouped.active!)}
          />
        ) : (
          <div className="border-border text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            No active sprint. Start a planning sprint to begin execution on the Board tab.
          </div>
        )}

        {grouped.planning.map((sprint) => (
          <SprintBlock
            key={sprint.id}
            sprint={sprint}
            tasks={grouped.bySprint.get(sprint.id) ?? []}
            variant="planning"
            onDropTask={(id) => void moveTask(id, sprint.id)}
            onOpenTask={onOpenTask}
            onStart={() => void handleStart(sprint.id)}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" aria-hidden />
          Create sprint
        </Button>

        {grouped.closed.length > 0 ? (
          <div className="border-border rounded-xl border">
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
              onClick={() => setClosedOpen((v) => !v)}
            >
              Completed sprints
              <ChevronDown
                className={`size-4 transition ${closedOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            {closedOpen ? (
              <div className="space-y-2 border-t px-3 py-2">
                {grouped.closed.map((sprint) => (
                  <SprintBlock
                    key={sprint.id}
                    sprint={sprint}
                    tasks={grouped.bySprint.get(sprint.id) ?? []}
                    variant="closed"
                    onDropTask={() => undefined}
                    onOpenTask={onOpenTask}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <CreateWorkSpaceSprintDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        workspaceId={workspaceId}
        onCreated={(s) => setSprints((prev) => [...prev, s])}
      />
      {closeSprint ? (
        <CloseWorkSpaceSprintDialog
          open={Boolean(closeSprint)}
          onOpenChange={(o) => !o && setCloseSprint(null)}
          workspaceId={workspaceId}
          sprint={closeSprint}
          planningSprints={grouped.planning}
          onClosed={async () => {
            const [nextSprints, taskList] = await Promise.all([
              workSpaceSprintsApi.list(workspaceId),
              fetchWorkspaceTaskPage(workspaceId),
            ]);
            setSprints(nextSprints);
            await applyServerTaskList(taskList.items);
            setCloseSprint(null);
          }}
        />
      ) : null}
    </div>
  );
}

function SprintBlock({
  sprint,
  tasks,
  variant,
  onDropTask,
  onOpenTask,
  onStart,
  onFinish,
}: {
  sprint: WorkSpaceSprint;
  tasks: Task[];
  variant: 'active' | 'planning' | 'closed';
  onDropTask: (taskId: string) => void;
  onOpenTask: (task: Task) => void;
  onStart?: () => void;
  onFinish?: () => void;
}) {
  const drop = useScrumDropTarget(onDropTask);
  const pct = sprintCompletionPercent(tasks);
  const disabled = variant === 'closed';

  return (
    <article
      className={`border-border rounded-xl border p-3 ${variant === 'active' ? 'bg-primary/5' : 'bg-card/30'}`}
      {...(disabled ? {} : drop)}
    >
      <header className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">{sprint.name}</h4>
          <p className="text-muted-foreground text-xs">
            {pct}% done · {tasks.length} tasks
            {sprint.endDate ? ` · due ${new Date(sprint.endDate).toLocaleDateString()}` : ''}
          </p>
          {sprint.goal ? <p className="text-muted-foreground mt-1 text-xs">{sprint.goal}</p> : null}
        </div>
        <div className="flex gap-1">
          {variant === 'planning' && onStart ? (
            <Button type="button" size="sm" onClick={onStart}>
              Start
            </Button>
          ) : null}
          {variant === 'active' && onFinish ? (
            <Button type="button" size="sm" onClick={onFinish}>
              Finish
            </Button>
          ) : null}
        </div>
      </header>
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-muted-foreground border-border rounded-lg border border-dashed p-3 text-center text-xs">
            {disabled ? 'No tasks' : 'Drag tasks from backlog or add new work.'}
          </p>
        ) : (
          tasks.map((task) => (
            <WorkspaceScrumTaskRow key={task.id} task={task} onOpen={onOpenTask} />
          ))
        )}
      </div>
    </article>
  );
}
