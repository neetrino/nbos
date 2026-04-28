'use client';

import { Building2, Package, UserCircle } from 'lucide-react';
import type { FullProject } from '@/lib/api/projects';

interface ProjectInfoCardProps {
  project: FullProject;
}

export function ProjectInfoCard({ project }: ProjectInfoCardProps) {
  return (
    <div className="bg-card border-border grid gap-6 rounded-xl border p-5 md:grid-cols-2">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Project Details</h3>
        <div className="space-y-2">
          {project.contact && (
            <InfoRow
              icon={UserCircle}
              label="Contact"
              value={`${project.contact.firstName} ${project.contact.lastName}`}
            />
          )}
          {project.company && (
            <InfoRow icon={Building2} label="Company" value={project.company.name} />
          )}
          <InfoRow
            icon={Package}
            label="Products / Extensions"
            value={`${project._count.products} / ${project._count.extensions}`}
          />
        </div>
      </div>
      {project.description && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Description</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{project.description}</p>
        </div>
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
    <div className="flex items-center justify-between text-sm">
      <div className="text-muted-foreground flex items-center gap-2">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
}
