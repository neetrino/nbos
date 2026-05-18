'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getWorkspaceBoardViewSegments } from '@/features/tasks/tasks-board-view-segments';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { tasksApi, type Task, type WorkSpace } from '@/lib/api/tasks';
import { workSpaceSprintsApi, type WorkSpaceSprint } from '@/lib/api/work-space-sprints';
import { WorkSpaceRuntime } from '@/features/tasks/work-spaces/WorkSpaceRuntime';
import { WorkSpaceAreaSegmented } from '@/features/tasks/work-spaces/WorkSpaceAreaSegmented';
import { buildDefaultTaskLink } from '@/features/tasks/work-spaces/work-space-utils';
import type { WorkspaceBoardView } from '@/features/tasks/work-spaces/use-workspace-runtime-board';
import type { WorkspaceArea } from '@/features/tasks/work-spaces/workspace-area';
import {
  WORKSPACE_AREA_ACTIVE,
  WORKSPACE_AREA_PLANNING,
} from '@/features/tasks/work-spaces/workspace-area';

interface ProductTasksTabProps {
  productId: string;
}

export function ProductTasksTab({ productId }: ProductTasksTabProps) {
  const { creatorId, creatorReady } = useTaskCreatorId();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workspace, setWorkspace] = useState<WorkSpace | null>(null);
  const [sprints, setSprints] = useState<WorkSpaceSprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceArea, setWorkspaceArea] = useState<WorkspaceArea>(WORKSPACE_AREA_ACTIVE);
  const [boardView, setBoardView] = useState<WorkspaceBoardView>('kanban');
  const openQuickCreateRef = useRef<(() => void) | null>(null);

  const newTaskDisabled = creatorReady && !creatorId;
  const isPlanningArea = workspaceArea === WORKSPACE_AREA_PLANNING;

  const fetchWorkSpaceTasks = useCallback(async () => {
    setLoading(true);
    try {
      const productWorkspace = await tasksApi.ensureProductWorkSpace(productId);
      const [workspaceTasks, linkedTasks] = await Promise.all([
        tasksApi.getAll({ workspaceId: productWorkspace.id, pageSize: 100 }),
        tasksApi.getByEntity('PRODUCT', productId),
      ]);
      setWorkspace(productWorkspace);
      setTasks(mergeTasks(workspaceTasks.items, linkedTasks));
      if (productWorkspace.scrumEnabled) {
        setSprints(await workSpaceSprintsApi.list(productWorkspace.id));
      } else {
        setSprints([]);
      }
    } catch {
      setWorkspace(null);
      setTasks([]);
      setSprints([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void fetchWorkSpaceTasks();
  }, [fetchWorkSpaceTasks]);

  const handleWorkspaceUpdate = useCallback(async (updated: WorkSpace) => {
    setWorkspace(updated);
    if (updated.scrumEnabled) {
      setSprints(await workSpaceSprintsApi.list(updated.id).catch(() => []));
    } else {
      setSprints([]);
      setWorkspaceArea(WORKSPACE_AREA_ACTIVE);
    }
  }, []);

  if (loading) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">Loading Work Space...</div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">
        Work Space could not be loaded.
      </div>
    );
  }

  const defaultLink = buildDefaultTaskLink(workspace);
  const legacyTaskCount = tasks.filter((task) => !task.workspaceId).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {legacyTaskCount > 0 ? (
          <StatusBadge label={`${legacyTaskCount} legacy linked`} variant="amber" />
        ) : null}
        <WorkSpaceAreaSegmented value={workspaceArea} onValueChange={setWorkspaceArea} />
        <Link
          href={`/work-spaces/${workspace.id}`}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          Open full Work Space
        </Link>
        {!isPlanningArea ? (
          <>
            <Tabs
              value={boardView}
              onValueChange={(value) => setBoardView(value as WorkspaceBoardView)}
            >
              <TabsList variant="segmented">
                {getWorkspaceBoardViewSegments(workspace.scrumEnabled).map((segment) => (
                  <TabsTrigger
                    key={segment.value}
                    value={segment.value}
                    aria-label={segment.ariaLabel}
                    className="gap-1.5 px-3 py-2"
                  >
                    {segment.icon}
                    {segment.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Button
              onClick={() => openQuickCreateRef.current?.()}
              disabled={newTaskDisabled}
              title={newTaskDisabled ? 'Employee profile required' : undefined}
            >
              <Plus size={16} />
              New Task
            </Button>
          </>
        ) : null}
      </div>

      <WorkSpaceRuntime
        workspace={workspace}
        tasks={tasks}
        setTasks={setTasks}
        sprints={sprints}
        setSprints={setSprints}
        mode="embedded"
        defaultTaskLink={defaultLink ?? undefined}
        hideInlineBoardToolbar
        boardView={boardView}
        setBoardView={setBoardView}
        workspaceArea={workspaceArea}
        onWorkspaceUpdated={handleWorkspaceUpdate}
        quickCreateRef={openQuickCreateRef}
      />
    </div>
  );
}

function mergeTasks(primary: Task[], secondary: Task[]): Task[] {
  const seen = new Set<string>();
  return [...primary, ...secondary].filter((task) => {
    if (seen.has(task.id)) return false;
    seen.add(task.id);
    return true;
  });
}
