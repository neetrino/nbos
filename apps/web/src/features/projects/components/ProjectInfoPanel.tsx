'use client';

import { EntityDriveNavAction } from '@/features/drive/EntityDriveNavAction';
import { buildDriveHrefWithProject } from '@/features/drive/drive-deep-link';
import type { FullProject } from '@/lib/api/projects';
import { cn } from '@/lib/utils';
import { DetailInfoSubsection } from './detail-info-subsection';
import { ProjectContactsSection } from './ProjectContactsSection';
import { ProjectDetailsFields } from './ProjectInfoCard';
import { ProjectParticipantsSection } from '@/features/platform-access/components/ProjectParticipantsSection';
import { ProjectLifecycleActions } from './ProjectLifecycleActions';

interface ProjectInfoPanelProps {
  project: FullProject;
  onProjectUpdated: (project: FullProject) => void;
  teamRefreshKey?: number;
  className?: string;
}

export function ProjectInfoPanel({
  project,
  onProjectUpdated,
  teamRefreshKey = 0,
  className,
}: ProjectInfoPanelProps) {
  const hasDescription = Boolean(project.description?.trim());

  return (
    <aside
      className={cn('bg-card border-border flex min-h-0 flex-col border p-5', className)}
      aria-label="Project information"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">About project</h2>
          <p className="text-muted-foreground mt-0.5 text-xs font-medium tabular-nums">
            {project.code}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ProjectLifecycleActions project={project} onProjectUpdated={onProjectUpdated} />
          <EntityDriveNavAction href={buildDriveHrefWithProject(project.id)} />
        </div>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        {hasDescription ? (
          <DetailInfoSubsection first>
            <ProjectDetailsFields project={project} />
          </DetailInfoSubsection>
        ) : null}

        <DetailInfoSubsection first={!hasDescription} className="shrink-0 pb-3">
          <ProjectContactsSection embedded project={project} onProjectUpdated={onProjectUpdated} />
        </DetailInfoSubsection>

        <DetailInfoSubsection title="Team" className="mt-4 flex min-h-0 flex-1 flex-col pt-6">
          <ProjectParticipantsSection
            projectId={project.id}
            refreshKey={teamRefreshKey}
            embedded
            className="flex min-h-0 flex-1 flex-col"
          />
        </DetailInfoSubsection>
      </div>
    </aside>
  );
}
