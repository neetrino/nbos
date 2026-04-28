'use client';

import { ArrowLeft, FolderKanban, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import type { FullProject } from '@/lib/api/projects';

interface ProjectHeaderProps {
  project: FullProject;
  onBack: () => void;
  onRefresh: () => void;
}

export function ProjectHeader({ project, onBack, onRefresh }: ProjectHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={18} />
        </Button>
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
      </div>
      <Button variant="outline" size="icon" onClick={onRefresh}>
        <RefreshCcw size={16} />
      </Button>
    </div>
  );
}
