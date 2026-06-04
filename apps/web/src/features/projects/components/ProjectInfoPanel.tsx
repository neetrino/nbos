'use client';

import { EntityDriveNavAction } from '@/features/drive/EntityDriveNavAction';
import { buildDriveHrefWithProject } from '@/features/drive/drive-deep-link';
import type { FullProject } from '@/lib/api/projects';
import { cn } from '@/lib/utils';
import { DetailInfoSubsection } from './detail-info-subsection';
import { ProjectContactsSection } from './ProjectContactsSection';
import { ProjectDetailsFields } from './ProjectInfoCard';
import { ProjectParticipantsSection } from '@/features/platform-access/components/ProjectParticipantsSection';

interface ProjectInfoPanelProps {
  project: FullProject;
  onProjectUpdated: (project: FullProject) => void;
  className?: string;
}

export function ProjectInfoPanel({ project, onProjectUpdated, className }: ProjectInfoPanelProps) {
  const hasDescription = Boolean(project.description?.trim());

  return (
    <aside
      className={cn('bg-card border-border rounded-xl border p-5', className)}
      aria-label="Project information"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">About project</h2>
          <p className="text-muted-foreground mt-0.5 text-xs font-medium tabular-nums">
            {project.code}
          </p>
        </div>
        <EntityDriveNavAction href={buildDriveHrefWithProject(project.id)} className="shrink-0" />
      </div>

      <div className="mt-4">
        {hasDescription ? (
          <DetailInfoSubsection first>
            <ProjectDetailsFields project={project} />
          </DetailInfoSubsection>
        ) : null}

        <DetailInfoSubsection first={!hasDescription} className="pb-3">
          <ProjectContactsSection embedded project={project} onProjectUpdated={onProjectUpdated} />
        </DetailInfoSubsection>

        <DetailInfoSubsection title="Team" className="mt-4 pt-6">
          <ProjectParticipantsSection projectId={project.id} embedded />
        </DetailInfoSubsection>
      </div>
    </aside>
  );
}
