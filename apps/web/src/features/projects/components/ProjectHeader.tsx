'use client';

import { FolderKanban } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type { FullProject } from '@/lib/api/projects';

interface ProjectHeaderProps {
  project: FullProject;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-accent/10 text-accent rounded-xl p-2.5">
        <FolderKanban size={20} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">{project.name}</h1>
          {project.isArchived && <StatusBadge label="Archived" variant="gray" />}
        </div>
        <p className="text-muted-foreground text-sm">{project.code}</p>
      </div>
    </div>
  );
}
