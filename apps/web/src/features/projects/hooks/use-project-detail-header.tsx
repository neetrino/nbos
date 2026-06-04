'use client';

import { useMemo } from 'react';
import { useHeaderContext, useHeaderModuleTitle } from '@/components/layout/header-context';
import { StatusBadge } from '@/components/shared';
import { usePageDocumentTitle } from '@/features/account/hooks/use-page-document-title';
import type { FullProject } from '@/lib/api/projects';

/** Project name in app top bar; code and archived badge in the context zone. */
export function useProjectDetailHeader(project: FullProject | null): void {
  useHeaderModuleTitle(project?.name ?? null);
  usePageDocumentTitle(project?.name ?? '');

  const headerContext = useMemo(() => {
    if (!project) return null;
    return {
      kind: 'custom' as const,
      node: (
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-muted-foreground truncate text-sm">{project.code}</span>
          {project.isArchived ? <StatusBadge label="Archived" variant="gray" /> : null}
        </div>
      ),
    };
  }, [project]);

  useHeaderContext(headerContext);
}
