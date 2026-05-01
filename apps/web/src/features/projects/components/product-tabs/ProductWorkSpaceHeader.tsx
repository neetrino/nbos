import Link from 'next/link';
import { Layers3 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import type { Task, WorkSpace } from '@/lib/api/tasks';

interface ProductWorkSpaceHeaderProps {
  workspace: WorkSpace | null;
  tasks: Task[];
}

export function ProductWorkSpaceHeader({ workspace, tasks }: ProductWorkSpaceHeaderProps) {
  const legacyTaskCount = tasks.filter((task) => !task.workspaceId).length;

  return (
    <div className="bg-card border-border rounded-xl border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
            <Layers3 size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold">{workspace?.name ?? 'Product Work Space'}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Planning context for Product execution tasks. Workflow status remains separate from
              backlog and sprint planning.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {workspace && (
            <Link
              href={`/work-spaces/${workspace.id}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Open full Work Space
            </Link>
          )}
          <StatusBadge
            label={workspace?.scrumEnabled ? 'Scrum-enabled' : 'Kanban'}
            variant={workspace?.scrumEnabled ? 'blue' : 'default'}
          />
          {legacyTaskCount > 0 && (
            <StatusBadge label={`${legacyTaskCount} legacy linked`} variant="amber" />
          )}
        </div>
      </div>
    </div>
  );
}
