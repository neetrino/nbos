'use client';

import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DETAIL_SHEET_SECTION_STRETCH_CLASS,
} from '@/components/shared';
import type { FullProject } from '@/lib/api/projects';
import { cn } from '@/lib/utils';

interface ProjectInfoCardProps {
  project: FullProject;
  className?: string;
}

/** Standalone card — prefer {@link ProjectInfoPanel} on project detail. */
export function ProjectInfoCard({ project, className }: ProjectInfoCardProps) {
  return (
    <div
      className={cn(
        DETAIL_SHEET_SECTION_STRETCH_CLASS,
        'bg-card border-border rounded-xl border p-5',
        className,
      )}
    >
      <h3 className="text-sm font-semibold">Project Details</h3>
      <div className="mt-3">
        <ProjectDetailsFields project={project} />
      </div>
    </div>
  );
}

export function ProjectDetailsFields({ project }: { project: FullProject }) {
  const description = project.description?.trim();
  if (!description) return null;

  return (
    <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
