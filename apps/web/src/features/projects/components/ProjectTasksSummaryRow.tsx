import Link from 'next/link';
import { ListChecks } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FullProject } from '@/lib/api/projects';

function countProjectScopedTasks(project: FullProject) {
  const fromProducts = project.products.reduce((sum, p) => sum + p._count.tasks, 0);
  const fromExtensions = project.extensions.reduce((sum, e) => sum + e._count.tasks, 0);
  return fromProducts + fromExtensions;
}

export function ProjectTasksSummaryRow({ project }: { project: FullProject }) {
  const taskCount = countProjectScopedTasks(project);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
      <div className="flex items-center gap-2 text-sm">
        <ListChecks className="text-muted-foreground size-4 shrink-0" />
        <div>
          <p className="font-medium">Tasks</p>
          <p className="text-muted-foreground text-xs">
            Aggregated Work Space task counts across products and extensions ({taskCount} total).
            Execution belongs on Product Work Space and global Tasks — not on the project shell.
          </p>
        </div>
      </div>
      <Link href="/tasks" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
        Open Tasks
      </Link>
    </div>
  );
}
