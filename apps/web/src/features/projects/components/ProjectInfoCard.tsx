'use client';

import { Package } from 'lucide-react';
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
  const hasDescription = Boolean(project.description?.trim());

  return (
    <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
      <InfoRow
        icon={Package}
        label="Products / Extensions"
        value={`${project._count.products} / ${project._count.extensions}`}
      />
      {hasDescription && (
        <p className="text-muted-foreground text-sm leading-relaxed">{project.description}</p>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="text-muted-foreground flex min-w-0 items-center gap-2">
        <Icon size={14} className="shrink-0" />
        <span>{label}</span>
      </div>
      <span className="shrink-0 font-medium tabular-nums">{value}</span>
    </div>
  );
}
