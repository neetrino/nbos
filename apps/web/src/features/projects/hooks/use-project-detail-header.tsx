'use client';

import { useMemo } from 'react';
import { useHeaderContext, useHeaderModuleTitle } from '@/components/layout/header-context';
import { HEADER_CONTEXT_STATUS_BADGE_CLASS } from '@/components/layout/header-context/header-module-title-constants';
import { StatusBadge } from '@/components/shared';
import { usePageDocumentTitle } from '@/features/account/hooks/use-page-document-title';
import type { FullProject } from '@/lib/api/projects';

function isProjectInTrash(project: FullProject): boolean {
  return project.trashedAt != null || project.isArchived;
}

/** Project name in app top bar; Trash badge in the context zone when applicable. */
export function useProjectDetailHeader(project: FullProject | null): void {
  useHeaderModuleTitle(project?.name ?? null);
  usePageDocumentTitle(project?.name ?? '');

  const headerContext = useMemo(() => {
    if (!project || !isProjectInTrash(project)) return null;
    return {
      kind: 'custom' as const,
      node: (
        <StatusBadge
          label="In Trash"
          variant="zinc"
          className={HEADER_CONTEXT_STATUS_BADGE_CLASS}
        />
      ),
    };
  }, [project]);

  useHeaderContext(headerContext);
}
