'use client';

import { ArrowLeft, FolderKanban, HardDrive } from 'lucide-react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/shared';
import type { FullProject } from '@/lib/api/projects';
import { buildDriveHrefWithProject } from '@/features/drive/drive-deep-link';
import { EntityDriveQuickAttach } from '@/features/drive/EntityDriveQuickAttach';

interface ProjectHeaderProps {
  project: FullProject;
  onBack: () => void;
}

export function ProjectHeader({ project, onBack }: ProjectHeaderProps) {
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
      <div className="flex flex-wrap items-center justify-end gap-2">
        <EntityDriveQuickAttach entityType="PROJECT" entityId={project.id} />
        <Link
          href={buildDriveHrefWithProject(project.id)}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
        >
          <HardDrive className="size-4" aria-hidden />
          Drive files
        </Link>
      </div>
    </div>
  );
}
