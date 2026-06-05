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
} from './workspace-runtime-task-filters';
import { useWorkSpaceDetailHeader } from './use-work-space-detail-header';
import { useWorkSpaceDetail } from './use-work-space-detail';

export function WorkSpaceDetailPage() {
  const params = useParams<{ id: string }>();
  const { creatorId, creatorReady } = useTaskCreatorId();
  const taskViewFilters = useWorkspaceRuntimeTaskFilters();
  const {
    workspace,
    tasks,
    setTasks,
    sprints,
    setSprints,
    loading,
    error,
    refetch,
    refreshTasksFromServer,
    loadMoreTasks,
    loadingMoreTasks,
    taskMeta,
    handleWorkspaceUpdate,
  } = useWorkSpaceDetail(params.id);
  const [editOpen, setEditOpen] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);
  const [workspaceArea, setWorkspaceArea] = useState<WorkspaceArea>(WORKSPACE_AREA_ACTIVE);
  const [boardView, setBoardView] = useState<WorkspaceBoardView>('kanban');
  const openQuickCreateRef = useRef<(() => void) | null>(null);

  const newTaskDisabled = creatorReady && !creatorId;
  const isPlanningArea = workspaceArea === WORKSPACE_AREA_PLANNING;

  useEffect(() => {
    if (boardView === 'planning') {
      setWorkspaceArea(WORKSPACE_AREA_PLANNING);
      setBoardView('kanban');
    }
  }, [boardView]);

  const onWorkspaceUpdate = useCallback(
    async (updated: Parameters<typeof handleWorkspaceUpdate>[0]) => {
      await handleWorkspaceUpdate(updated);
      if (!updated.scrumEnabled) {
        setWorkspaceArea(WORKSPACE_AREA_ACTIVE);
      }
    },
    [handleWorkspaceUpdate],
  );

  const contextHref = workspace ? buildWorkSpaceContextHref(workspace) : null;
  const defaultLink = useMemo(() => buildDefaultTaskLink(workspace), [workspace]);

  useWorkSpaceDetailHeader(workspace);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void refetch()} />;
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
              <WorkSpaceScrumPlanningEnable workspace={workspace} onUpdated={onWorkspaceUpdate} />
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
        refreshTasksFromServer={refreshTasksFromServer}
        taskListTotal={taskMeta?.total}
        onLoadMoreTasks={() => void loadMoreTasks()}
        loadingMoreTasks={loadingMoreTasks}
      />

      <EditWorkSpaceDialog
        workspace={workspace}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={onWorkspaceUpdate}
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
