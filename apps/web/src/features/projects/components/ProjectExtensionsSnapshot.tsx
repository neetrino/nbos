'use client';

import { Puzzle } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type { FullProject } from '@/lib/api/projects';
import { getExtensionStatus } from '@/features/projects/constants/projects';

interface ProjectExtensionsSnapshotProps {
  project: FullProject;
}

export function ProjectExtensionsSnapshot({ project }: ProjectExtensionsSnapshotProps) {
  if (project.extensions.length === 0) return null;

  return (
    <div className="bg-card border-border rounded-xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Puzzle size={16} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold">Extensions Snapshot</h3>
        </div>
        <span className="text-muted-foreground text-xs">{project.extensions.length} total</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {project.extensions.slice(0, 4).map((extension) => {
          const status = getExtensionStatus(extension.status);
          return (
            <div key={extension.id} className="bg-secondary/40 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{extension.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {extension.product?.name ?? 'Unlinked extension'}
                  </p>
                </div>
                {status && <StatusBadge label={status.label} variant={status.variant} />}
              </div>

              <div className="text-muted-foreground mt-3 flex items-center gap-3 text-xs">
                <span>{extension._count.tasks} tasks</span>
                <span>{extension.size.toLowerCase()}</span>
                {extension.assignee && (
                  <span>
                    {extension.assignee.firstName} {extension.assignee.lastName}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
