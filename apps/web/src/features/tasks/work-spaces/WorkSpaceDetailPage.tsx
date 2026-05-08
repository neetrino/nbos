'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowUpRight, Plus, Settings } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/shared';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TASKS_BOARD_VIEW_SEGMENTS } from '@/features/tasks/tasks-board-view-segments';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { tasksApi, type Task, type WorkSpace } from '@/lib/api/tasks';
import { EditWorkSpaceDialog } from './EditWorkSpaceDialog';
import { WorkSpaceDetailSettingsDialog } from './WorkSpaceDetailSettingsDialog';
import { WorkSpaceRuntime } from './WorkSpaceRuntime';
import {
  buildWorkSpaceContextHref,
  buildDefaultTaskLink,
  getWorkSpaceTypeLabel,
  getWorkSpaceTypeVariant,
} from './work-space-utils';
import type { WorkspaceBoardView } from './use-workspace-runtime-board';

export function WorkSpaceDetailPage() {
  const params = useParams<{ id: string }>();
  const { creatorId, creatorReady } = useTaskCreatorId();
  const [workspace, setWorkspace] = useState<WorkSpace | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [boardView, setBoardView] = useState<WorkspaceBoardView>('kanban');
  const openQuickCreateRef = useRef<(() => void) | null>(null);

  const newTaskDisabled = creatorReady && !creatorId;

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

  const handleWorkspaceUpdate = (updated: WorkSpace) => {
    setWorkspace(updated);
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={fetchWorkspace} />;
  if (!workspace) return null;

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader
        title={workspace.name}
        description={
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
        }
      >
        {contextHref && (
          <Link href={contextHref} className={buttonVariants({ variant: 'outline' })}>
            Context <ArrowUpRight size={14} />
          </Link>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setSettingsOpen(true)}
          aria-label="Work space settings"
        >
          <Settings size={16} />
        </Button>
        <Tabs
          value={boardView}
          onValueChange={(value) => setBoardView(value as WorkspaceBoardView)}
        >
          <TabsList variant="segmented">
            {TASKS_BOARD_VIEW_SEGMENTS.map((segment) => (
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
      </PageHeader>

      <WorkSpaceRuntime
        workspace={workspace}
        tasks={tasks}
        setTasks={setTasks}
        mode="standalone"
        defaultTaskLink={defaultLink ?? undefined}
        hideInlineBoardToolbar
        boardView={boardView}
        setBoardView={setBoardView}
        quickCreateRef={openQuickCreateRef}
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
    </div>
  );
}
