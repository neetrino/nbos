'use client';

import { useMemo } from 'react';
import { useHeaderContext, useHeaderModuleTitle } from '@/components/layout/header-context';
import { StatusBadge } from '@/components/shared';
import { usePageDocumentTitle } from '@/features/account/hooks/use-page-document-title';
import type { FullProject } from '@/lib/api/projects';

/** Project name in app top bar; archived badge in the context zone when applicable. */
export function useProjectDetailHeader(project: FullProject | null): void {
  useHeaderModuleTitle(project?.name ?? null);
  usePageDocumentTitle(project?.name ?? '');

  const headerContext = useMemo(() => {
    if (!project?.isArchived) return null;
    return {
      kind: 'custom' as const,
      node: <StatusBadge label="Archived" variant="gray" />,
    };
  }, [project?.isArchived]);

  useHeaderContext(headerContext);
}
