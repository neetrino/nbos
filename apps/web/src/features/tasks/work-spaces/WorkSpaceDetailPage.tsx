'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
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
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { EditWorkSpaceDialog } from './EditWorkSpaceDialog';
import { WorkSpaceDetailSettingsSheet } from './WorkSpaceDetailSettingsSheet';
import { WorkSpaceRuntime } from './WorkSpaceRuntime';
import { WorkSpaceAreaSegmented } from './WorkSpaceAreaSegmented';
import { WorkSpaceScrumPlanningEnable } from './WorkSpaceScrumPlanningEnable';
import { buildWorkSpaceContextHref, buildDefaultTaskLink } from './work-space-utils';
import type { WorkspaceBoardView } from './use-workspace-runtime-board';
import { useWorkspaceBoardViewState } from './use-workspace-board-view-state';
import { WORKSPACE_AREA_ACTIVE, WORKSPACE_AREA_PLANNING } from './workspace-area';
import { WorkSpaceDriveSheet } from './WorkSpaceDriveSheet';
import { WorkSpaceDiscussionSheet, WorkSpaceDiscussionTrigger } from './WorkSpaceDiscussionSheet';
import {
  useWorkspaceRuntimeTaskFilters,
  WORKSPACE_TASK_FILTER_CONFIGS,
} from './workspace-runtime-task-filters';
import { useWorkSpaceDetailHeader } from './use-work-space-detail-header';
import { useWorkSpaceDetail } from './use-work-space-detail';
import { SEARCH_FILTER_PAGE_ID } from '@/lib/persisted-client-state';

export function WorkSpaceDetailPage() {
  const params = useParams<{ id: string }>();
  const { creatorId, creatorReady } = useTaskCreatorId();
  const taskViewFilters = useWorkspaceRuntimeTaskFilters(
    SEARCH_FILTER_PAGE_ID.tasksWorkspaceRuntime,
  );
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
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const { boardView, handleBoardViewChange, workspaceArea, setWorkspaceArea } =
    useWorkspaceBoardViewState();
  const openQuickCreateRef = useRef<(() => void) | null>(null);
  const isMobileViewport = useIsMobileViewport();

  const newTaskDisabled = creatorReady && !creatorId;
  const isPlanningArea = workspaceArea === WORKSPACE_AREA_PLANNING;
  const showDesktopBoardChrome = !isMobileViewport && !isPlanningArea;
  const effectiveBoardView: WorkspaceBoardView =
    isMobileViewport && !isPlanningArea ? 'kanban' : boardView;

  const onWorkspaceUpdate = useCallback(
    async (updated: Parameters<typeof handleWorkspaceUpdate>[0]) => {
      await handleWorkspaceUpdate(updated);
      if (!updated.scrumEnabled) {
        setWorkspaceArea(WORKSPACE_AREA_ACTIVE);
      }
    },
    [handleWorkspaceUpdate, setWorkspaceArea],
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
            filters={showDesktopBoardChrome ? WORKSPACE_TASK_FILTER_CONFIGS : undefined}
            filterValues={showDesktopBoardChrome ? taskViewFilters.heroFilterValues : undefined}
            onFilterChange={showDesktopBoardChrome ? taskViewFilters.onFilterChange : undefined}
            onClearAll={showDesktopBoardChrome ? taskViewFilters.onClearFilters : undefined}
          />
        }
        viewMode={
          showDesktopBoardChrome ? (
            <ViewModeSwitch
              value={boardView}
              onChange={handleBoardViewChange}
              options={WORKSPACE_BOARD_VIEW_OPTIONS}
            />
          ) : undefined
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
            <WorkSpaceDiscussionTrigger onClick={() => setDiscussionOpen(true)} />
            <EntityDriveNavAction onClick={() => setDriveOpen(true)} />
            <WorkSpaceDetailSettingsSheet
              workspaceId={workspace.id}
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
        boardView={effectiveBoardView}
        setBoardView={handleBoardViewChange}
        workspaceArea={workspaceArea}
        quickCreateRef={openQuickCreateRef}
        syncTaskSheetToUrl
        refreshTasksFromServer={refreshTasksFromServer}
        taskListTotal={taskMeta?.total}
        taskListHasMorePages={Boolean(taskMeta && taskMeta.page < taskMeta.totalPages)}
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
      <WorkSpaceDiscussionSheet
        open={discussionOpen}
        onOpenChange={setDiscussionOpen}
        workspaceId={workspace.id}
        workspaceName={workspace.name}
      />
    </div>
  );
}
