'use client';

import { ExtensionEntityViews } from '@/features/projects/components/extension-entity-views';
import { PROJECT_SECTION_TITLE_CLASS } from '@/features/projects/components/project-detail-layout.constants';
import type { ProjectDetailViewMode } from '@/features/projects/components/project-detail-layout.constants';
import { projectExtensionToViewModel } from '@/features/projects/utils/extension-entity-view-mappers';
import type { ProjectExtensionSummary } from '@/lib/api/projects';

interface ProjectExtensionsSectionProps {
  extensions: ProjectExtensionSummary[];
  viewMode: ProjectDetailViewMode;
  onOpenExtension: (extension: ProjectExtensionSummary) => void;
}

export function ProjectExtensionsSection({
  extensions,
  viewMode,
  onOpenExtension,
}: ProjectExtensionsSectionProps) {
  if (extensions.length === 0) return null;

  const items = extensions.map((extension) => projectExtensionToViewModel(extension));

  return (
    <div className="min-w-0 space-y-4 overflow-hidden">
      <div className="flex items-center gap-3">
        <h2 className={PROJECT_SECTION_TITLE_CLASS}>Extensions</h2>
        <span className="bg-secondary text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
          {extensions.length}
        </span>
      </div>

      <ExtensionEntityViews
        extensions={items}
        viewMode={viewMode}
        onOpen={(id) => {
          const extension = extensions.find((row) => row.id === id);
          if (extension) onOpenExtension(extension);
        }}
      />
    </div>
  );
}
