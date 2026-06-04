'use client';

import { Package } from 'lucide-react';
import {
  DETAIL_SHEET_PANEL_DIVIDER_CLASS,
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DETAIL_SHEET_SECTION_STRETCH_CLASS,
} from '@/components/shared';
import type { FullProject } from '@/lib/api/projects';
import { cn } from '@/lib/utils';

interface ProjectInfoCardProps {
  project: FullProject;
  className?: string;
}

export function ProjectInfoCard({ project, className }: ProjectInfoCardProps) {
  const hasDescription = Boolean(project.description?.trim());

  return (
    <div
      className={cn(
        DETAIL_SHEET_SECTION_STRETCH_CLASS,
        'bg-card border-border rounded-xl border p-5',
        className,
      )}
    >
      <h3 className="text-sm font-semibold">Project Details</h3>
      <div className={cn(DETAIL_SHEET_SECTION_BODY_CLASS, 'mt-3')}>
        <div className="space-y-2">
          <InfoRow
            icon={Package}
            label="Products / Extensions"
            value={`${project._count.products} / ${project._count.extensions}`}
          />
        </div>
        {hasDescription && (
          <div className={DETAIL_SHEET_PANEL_DIVIDER_CLASS}>
            <p className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-widest uppercase">
              Description
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">{project.description}</p>
          </div>
        )}
      </div>
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
