'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Pencil, RefreshCcw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/shared';
import { tasksApi, type Task, type WorkSpace } from '@/lib/api/tasks';
import { EditWorkSpaceDialog } from './EditWorkSpaceDialog';
import { WorkSpaceRuntime } from './WorkSpaceRuntime';
import {
  buildWorkSpaceContextHref,
  buildDefaultTaskLink,
  getWorkSpaceContextLabel,
  getWorkSpaceTypeLabel,
  getWorkSpaceTypeVariant,
} from './work-space-utils';

export function WorkSpaceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkSpace | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

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
      </PageHeader>

      <WorkSpaceHeader workspace={workspace} taskCount={tasks.length} />

      <WorkSpaceRuntime
        workspace={workspace}
        tasks={tasks}
        setTasks={setTasks}
        onRefresh={fetchWorkspace}
        mode="standalone"
        defaultTaskLink={defaultLink ?? undefined}
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
