'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowUpRight, Plus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { EntityDriveNavAction } from '@/features/drive/EntityDriveNavAction';
import {
  ErrorState,
  IntegratedSearchFilters,
  LoadingState,
  PageHero,
  ViewModeSwitch,
} from '@/components/shared';
import { WORKSPACE_BOARD_VIEW_OPTIONS } from '@/features/tasks/tasks-board-view-segments';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { tasksApi, type Task, type WorkSpace } from '@/lib/api/tasks';
import { workSpaceSprintsApi, type WorkSpaceSprint } from '@/lib/api/work-space-sprints';
import { EditWorkSpaceDialog } from './EditWorkSpaceDialog';
import { WorkSpaceDetailSettingsSheet } from './WorkSpaceDetailSettingsSheet';
import { WorkSpaceRuntime } from './WorkSpaceRuntime';
import { WorkSpaceAreaSegmented } from './WorkSpaceAreaSegmented';
import { WorkSpaceScrumPlanningEnable } from './WorkSpaceScrumPlanningEnable';
import { buildWorkSpaceContextHref, buildDefaultTaskLink } from './work-space-utils';
import type { WorkspaceBoardView } from './use-workspace-runtime-board';
import type { WorkspaceArea } from './workspace-area';
import { WORKSPACE_AREA_ACTIVE, WORKSPACE_AREA_PLANNING } from './workspace-area';
import { WorkSpaceDriveSheet } from './WorkSpaceDriveSheet';
import {
  useWorkspaceRuntimeTaskFilters,
  WORKSPACE_TASK_FILTER_CONFIGS,
} from './workspace-runtime-filter-bar';
import { useWorkSpaceDetailHeader } from './use-work-space-detail-header';

export function WorkSpaceDetailPage() {
  const params = useParams<{ id: string }>();
  const { creatorId, creatorReady } = useTaskCreatorId();
  const taskViewFilters = useWorkspaceRuntimeTaskFilters();
  const [workspace, setWorkspace] = useState<WorkSpace | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<WorkSpaceSprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);
  const [workspaceArea, setWorkspaceArea] = useState<WorkspaceArea>(WORKSPACE_AREA_ACTIVE);
  const [boardView, setBoardView] = useState<WorkspaceBoardView>('kanban');
  const openQuickCreateRef = useRef<(() => void) | null>(null);

  const newTaskDisabled = creatorReady && !creatorId;
  const isPlanningArea = workspaceArea === WORKSPACE_AREA_PLANNING;

  const fetchWorkspace = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const [workspaceData, taskData, sprintData] = await Promise.all([
        tasksApi.getWorkSpaceById(params.id),
        tasksApi.getAll({ workspaceId: params.id, pageSize: 100 }),
        workSpaceSprintsApi.list(params.id).catch(() => [] as WorkSpaceSprint[]),
      ]);
      setWorkspace(workspaceData);
      setTasks(taskData.items);
      setSprints(workspaceData.scrumEnabled ? sprintData : []);
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

  useEffect(() => {
    if (boardView === 'planning') {
      setWorkspaceArea(WORKSPACE_AREA_PLANNING);
      setBoardView('kanban');
    }
  }, [boardView]);

  const contextHref = workspace ? buildWorkSpaceContextHref(workspace) : null;
  const defaultLink = useMemo(() => buildDefaultTaskLink(workspace), [workspace]);

  const handleWorkspaceUpdate = useCallback(async (updated: WorkSpace) => {
    setWorkspace(updated);
    if (updated.scrumEnabled) {
      const sprintData = await workSpaceSprintsApi
        .list(updated.id)
        .catch(() => [] as WorkSpaceSprint[]);
      setSprints(sprintData);
    } else {
      setSprints([]);
      setWorkspaceArea(WORKSPACE_AREA_ACTIVE);
    }
  }, []);

  useWorkSpaceDetailHeader(workspace);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={fetchWorkspace} />;
  if (!workspace) return null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <PageHero
        title={workspace.name}
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
            {contextHref ? (
              <Link href={contextHref} className={buttonVariants({ variant: 'outline' })}>
                Context <ArrowUpRight size={14} aria-hidden />
              </Link>
            ) : null}
            {isPlanningArea ? (
              <WorkSpaceScrumPlanningEnable
                workspace={workspace}
                onUpdated={handleWorkspaceUpdate}
              />
            ) : null}
            <EntityDriveNavAction onClick={() => setDriveOpen(true)} />
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
      />

      <WorkSpaceRuntime
        workspace={workspace}
        tasks={tasks}
        setTasks={setTasks}
        sprints={sprints}
        setSprints={setSprints}
        mode="standalone"
        defaultTaskLink={defaultLink ?? undefined}
        taskViewFilters={taskViewFilters}
        boardView={boardView}
        setBoardView={setBoardView}
        workspaceArea={workspaceArea}
        quickCreateRef={openQuickCreateRef}
        syncTaskSheetToUrl
      />

      <EditWorkSpaceDialog
        workspace={workspace}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={handleWorkspaceUpdate}
      />

      <WorkSpaceDriveSheet
        open={driveOpen}
        onOpenChange={setDriveOpen}
        workSpaceId={workspace.id}
        workSpaceName={workspace.name}
      />
    </div>
  );
}
