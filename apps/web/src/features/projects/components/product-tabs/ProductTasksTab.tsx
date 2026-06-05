'use client';

import { useCallback, useRef, useState, type SetStateAction } from 'react';
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
} from '@/features/tasks/work-spaces/workspace-runtime-task-filters';
import type { UseProductWorkSpaceTabResult } from '@/features/projects/hooks/use-product-work-space-tab';

type ProductTasksTabProps = UseProductWorkSpaceTabResult;

export function ProductTasksTab({
  workspace,
  tasks,
  setTasks,
  sprints,
  setSprints,
  loading,
  error,
  refetch,
  handleWorkspaceUpdate,
  refreshTasksFromServer,
  loadMoreTasks,
  loadingMoreTasks,
  taskMeta,
}: ProductTasksTabProps) {
  const { creatorReady, creatorId } = useTaskCreatorId();
  const taskViewFilters = useWorkspaceRuntimeTaskFilters();
  const [editOpen, setEditOpen] = useState(false);
  const [workspaceArea, setWorkspaceArea] = useState<WorkspaceArea>(WORKSPACE_AREA_ACTIVE);
  const [boardView, setBoardView] = useState<WorkspaceBoardView>('kanban');
  const openQuickCreateRef = useRef<(() => void) | null>(null);

  const newTaskDisabled = creatorReady && !creatorId;
  const isPlanningArea = workspaceArea === WORKSPACE_AREA_PLANNING;

  const handleBoardViewChange = useCallback(
    (next: SetStateAction<WorkspaceBoardView>) => {
      const resolved = typeof next === 'function' ? next(boardView) : next;
      if (resolved === 'planning') {
        setWorkspaceArea(WORKSPACE_AREA_PLANNING);
        setBoardView('kanban');
        return;
      }
      setBoardView(resolved);
    },
    [boardView],
  );

  const onWorkspaceUpdate = async (updated: Parameters<typeof handleWorkspaceUpdate>[0]) => {
    await handleWorkspaceUpdate(updated);
    if (!updated.scrumEnabled) {
      setWorkspaceArea(WORKSPACE_AREA_ACTIVE);
    }
  };

  if (loading && !workspace) return <LoadingState count={2} className="max-w-xl" />;
  if (error) return <ErrorState description={error} onRetry={() => void refetch()} />;
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
              onChange={handleBoardViewChange}
              options={WORKSPACE_BOARD_VIEW_OPTIONS}
            />
          )
        }
        trailing={
          <>
            {isPlanningArea ? (
              <WorkSpaceScrumPlanningEnable workspace={workspace} onUpdated={onWorkspaceUpdate} />
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
        setBoardView={handleBoardViewChange}
        workspaceArea={workspaceArea}
        quickCreateRef={openQuickCreateRef}
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
    </div>
  );
}
