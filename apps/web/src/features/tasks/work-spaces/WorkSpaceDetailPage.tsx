'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowUpRight, HardDrive, Plus, Settings } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getWorkspaceBoardViewSegments } from '@/features/tasks/tasks-board-view-segments';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { tasksApi, type Task, type WorkSpace } from '@/lib/api/tasks';
import { workSpaceSprintsApi, type WorkSpaceSprint } from '@/lib/api/work-space-sprints';
import { EditWorkSpaceDialog } from './EditWorkSpaceDialog';
import { WorkSpaceDetailSettingsDialog } from './WorkSpaceDetailSettingsDialog';
import { WorkSpaceRuntime } from './WorkSpaceRuntime';
import { WorkSpaceAreaSegmented } from './WorkSpaceAreaSegmented';
import { WorkSpaceScrumPlanningEnable } from './WorkSpaceScrumPlanningEnable';
import {
  buildWorkSpaceContextHref,
  buildDefaultTaskLink,
  getWorkSpaceTypeLabel,
  getWorkSpaceTypeVariant,
} from './work-space-utils';
import type { WorkspaceBoardView } from './use-workspace-runtime-board';
import type { WorkspaceArea } from './workspace-area';
import { WORKSPACE_AREA_ACTIVE, WORKSPACE_AREA_PLANNING } from './workspace-area';
import { WorkSpaceDriveSheet } from './WorkSpaceDriveSheet';

export function WorkSpaceDetailPage() {
  const params = useParams<{ id: string }>();
  const { creatorId, creatorReady } = useTaskCreatorId();
  const [workspace, setWorkspace] = useState<WorkSpace | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<WorkSpaceSprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={fetchWorkspace} />;
  if (!workspace) return null;

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
            <h1 className="text-foreground shrink-0 text-2xl font-semibold tracking-tight">
              {workspace.name}
            </h1>
            <WorkSpaceAreaSegmented
              value={workspaceArea}
              onValueChange={setWorkspaceArea}
              className="min-w-0"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge
              label={getWorkSpaceTypeLabel(workspace.type)}
              variant={getWorkSpaceTypeVariant(workspace.type)}
            />
            <StatusBadge
              label={workspace.scrumEnabled ? 'Scrum' : 'Kanban'}
              variant={workspace.scrumEnabled ? 'blue' : 'gray'}
            />
            <span className="text-muted-foreground tabular-nums">{tasks.length} tasks</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {contextHref && (
            <Link href={contextHref} className={buttonVariants({ variant: 'outline' })}>
              Context <ArrowUpRight size={14} />
            </Link>
          )}
          {isPlanningArea ? (
            <WorkSpaceScrumPlanningEnable workspace={workspace} onUpdated={handleWorkspaceUpdate} />
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setDriveOpen(true)}
          >
            <HardDrive className="size-4" aria-hidden />
            Drive
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            aria-label="Work space settings"
          >
            <Settings size={16} />
          </Button>
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
      </div>

      <WorkSpaceRuntime
        workspace={workspace}
        tasks={tasks}
        setTasks={setTasks}
        sprints={sprints}
        setSprints={setSprints}
        mode="standalone"
        defaultTaskLink={defaultLink ?? undefined}
        hideInlineBoardToolbar
        boardView={boardView}
        setBoardView={setBoardView}
        workspaceArea={workspaceArea}
        quickCreateRef={openQuickCreateRef}
        syncTaskSheetToUrl
      />

      <WorkSpaceDetailSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        workspaceName={workspace.name}
        tasks={tasks}
        onEditWorkSpace={() => setEditOpen(true)}
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
