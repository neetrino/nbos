'use client';

import type { ReactNode } from 'react';
import {
  DETAIL_SHEET_PANEL_DIVIDER_CLASS,
  DETAIL_SHEET_SUBSECTION_LABEL_CLASS,
} from '@/components/shared';
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
  return (
    <aside
      className={cn('bg-card border-border rounded-xl border p-5', className)}
      aria-label="Project information"
    >
      <h2 className="text-sm font-semibold">About project</h2>

      <div className="mt-4">
        <ProjectInfoSubsection title="Client contacts" first>
          <ProjectContactsSection embedded project={project} onProjectUpdated={onProjectUpdated} />
        </ProjectInfoSubsection>

        <ProjectInfoSubsection title="Details">
          <ProjectDetailsFields project={project} />
        </ProjectInfoSubsection>

        <ProjectInfoSubsection title="Team">
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
}: {
  title: string;
  children: ReactNode;
  first?: boolean;
}) {
  return (
    <section className={cn(!first && DETAIL_SHEET_PANEL_DIVIDER_CLASS, 'space-y-3')}>
      <h3 className={DETAIL_SHEET_SUBSECTION_LABEL_CLASS}>{title}</h3>
      {children}
    </section>
  );
}
