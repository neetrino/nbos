'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Plus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  ErrorState,
  IntegratedSearchFilters,
  LoadingState,
  PageHero,
  StatusBadge,
  ViewModeSwitch,
} from '@/components/shared';
import { WORKSPACE_BOARD_VIEW_OPTIONS } from '@/features/tasks/tasks-board-view-segments';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { tasksApi, type Task, type WorkSpace } from '@/lib/api/tasks';
import { workSpaceSprintsApi, type WorkSpaceSprint } from '@/lib/api/work-space-sprints';
import { EditWorkSpaceDialog } from '@/features/tasks/work-spaces/EditWorkSpaceDialog';
import { WorkSpaceDetailSettingsSheet } from '@/features/tasks/work-spaces/WorkSpaceDetailSettingsSheet';
import { WorkSpaceRuntime } from '@/features/tasks/work-spaces/WorkSpaceRuntime';
import { WorkSpaceAreaSegmented } from '@/features/tasks/work-spaces/WorkSpaceAreaSegmented';
import { WorkSpaceScrumPlanningEnable } from '@/features/tasks/work-spaces/WorkSpaceScrumPlanningEnable';
import { buildDefaultTaskLink } from '@/features/tasks/work-spaces/work-space-utils';
import type { WorkspaceBoardView } from '@/features/tasks/work-spaces/use-workspace-runtime-board';
import type { WorkspaceArea } from '@/features/tasks/work-spaces/workspace-area';
import {
  WORKSPACE_AREA_ACTIVE,
  WORKSPACE_AREA_PLANNING,
} from '@/features/tasks/work-spaces/workspace-area';
import {
  useWorkspaceRuntimeTaskFilters,
  WORKSPACE_TASK_FILTER_CONFIGS,
} from '@/features/tasks/work-spaces/workspace-runtime-filter-bar';

interface ProductTasksTabProps {
  productId: string;
}

export function ProductTasksTab({ productId }: ProductTasksTabProps) {
  const { creatorId, creatorReady } = useTaskCreatorId();
  const taskViewFilters = useWorkspaceRuntimeTaskFilters();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workspace, setWorkspace] = useState<WorkSpace | null>(null);
  const [sprints, setSprints] = useState<WorkSpaceSprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
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
      setError(null);
    } catch {
      setWorkspace(null);
      setTasks([]);
      setSprints([]);
      setError('Work Space could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void fetchWorkSpaceTasks();
  }, [fetchWorkSpaceTasks]);

  useEffect(() => {
    if (boardView === 'planning') {
      setWorkspaceArea(WORKSPACE_AREA_PLANNING);
      setBoardView('kanban');
    }
  }, [boardView]);

  const handleWorkspaceUpdate = useCallback(async (updated: WorkSpace) => {
    setWorkspace(updated);
    if (updated.scrumEnabled) {
      setSprints(await workSpaceSprintsApi.list(updated.id).catch(() => []));
    } else {
      setSprints([]);
      setWorkspaceArea(WORKSPACE_AREA_ACTIVE);
    }
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={fetchWorkSpaceTasks} />;
  if (!workspace) return null;

  const defaultLink = buildDefaultTaskLink(workspace);
  const legacyTaskCount = tasks.filter((task) => !task.workspaceId).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <PageHero
        syncModuleTitle={false}
        tabs={<WorkSpaceAreaSegmented value={workspaceArea} onValueChange={setWorkspaceArea} />}
        search={
          <IntegratedSearchFilters
            search={taskViewFilters.search}
            onSearchChange={taskViewFilters.onSearchChange}
            searchPlaceholder="Search by task, project, product, workspace…"
            filters={WORKSPACE_TASK_FILTER_CONFIGS}
            filterValues={taskViewFilters.heroFilterValues}
            onFilterChange={taskViewFilters.onFilterChange}
            onClearAll={taskViewFilters.onClearFilters}
          />
        }
        viewMode={
          isPlanningArea ? undefined : (
            <ViewModeSwitch
              value={boardView}
              onChange={setBoardView}
              options={WORKSPACE_BOARD_VIEW_OPTIONS}
            />
          )
        }
        trailing={
          <>
            {isPlanningArea ? (
              <WorkSpaceScrumPlanningEnable
                workspace={workspace}
                onUpdated={handleWorkspaceUpdate}
              />
            ) : null}
            <Link
              href={`/work-spaces/${workspace.id}`}
              className={buttonVariants({ variant: 'outline' })}
            >
              Work Space <ArrowUpRight size={14} aria-hidden />
            </Link>
            <WorkSpaceDetailSettingsSheet
              workspaceName={workspace.name}
              tasks={tasks}
              onEditWorkSpace={() => setEditOpen(true)}
            />
            {!isPlanningArea ? (
              <Button
                onClick={() => openQuickCreateRef.current?.()}
                disabled={newTaskDisabled}
                title={newTaskDisabled ? 'Employee profile required' : undefined}
              >
                <Plus size={16} aria-hidden />
                New Task
              </Button>
            ) : null}
          </>
        }
        secondaryTabs={
          legacyTaskCount > 0 ? (
            <StatusBadge label={`${legacyTaskCount} legacy linked`} variant="amber" />
          ) : undefined
        }
      />

      <WorkSpaceRuntime
        workspace={workspace}
        tasks={tasks}
        setTasks={setTasks}
        sprints={sprints}
        setSprints={setSprints}
        mode="embedded"
        defaultTaskLink={defaultLink ?? undefined}
        taskViewFilters={taskViewFilters}
        boardView={boardView}
        setBoardView={setBoardView}
        workspaceArea={workspaceArea}
        quickCreateRef={openQuickCreateRef}
      />

      <EditWorkSpaceDialog
        workspace={workspace}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={handleWorkspaceUpdate}
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
