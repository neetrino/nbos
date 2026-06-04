'use client';

import type { ReactNode } from 'react';
import {
  DETAIL_SHEET_PANEL_DIVIDER_CLASS,
  DETAIL_SHEET_SUBSECTION_LABEL_CLASS,
} from '@/components/shared';
import { EntityDriveNavAction } from '@/features/drive/EntityDriveNavAction';
import { buildDriveHrefWithProject } from '@/features/drive/drive-deep-link';
import type { FullProject } from '@/lib/api/projects';
import { cn } from '@/lib/utils';
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
          <ProjectInfoSubsection first>
            <ProjectDetailsFields project={project} />
          </ProjectInfoSubsection>
        ) : null}

        <ProjectInfoSubsection first={!hasDescription} className="pb-3">
          <ProjectContactsSection embedded project={project} onProjectUpdated={onProjectUpdated} />
        </ProjectInfoSubsection>

        <ProjectInfoSubsection title="Team" className="mt-4 pt-6">
          <ProjectParticipantsSection projectId={project.id} embedded />
        </ProjectInfoSubsection>
      </div>
    </aside>
  );
}

function ProjectInfoSubsection({
  title,
  children,
  first = false,
  className,
}: {
  title?: string;
  children: ReactNode;
  first?: boolean;
  className?: string;
}) {
  return (
    <section className={cn(!first && DETAIL_SHEET_PANEL_DIVIDER_CLASS, 'space-y-3', className)}>
      {title ? <h3 className={DETAIL_SHEET_SUBSECTION_LABEL_CLASS}>{title}</h3> : null}
      {children}
    </section>
  );
}
