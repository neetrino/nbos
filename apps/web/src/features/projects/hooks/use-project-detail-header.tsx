'use client';

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/shared';
import { useHeaderContext, useHeaderModuleTitle } from '@/components/layout/header-context';
import {
  HEADER_CONTEXT_STATUS_BADGE_CLASS,
  HEADER_MODULE_TITLE_LABEL,
} from '@/components/layout/header-context/header-module-title-constants';
import { usePageDocumentTitle } from '@/features/account/hooks/use-page-document-title';
import { InlineEditableEntityTitle } from '@/features/projects/components/InlineEditableEntityTitle';
import { getApiErrorMessage } from '@/lib/api-errors';
import { projectsApi, type FullProject } from '@/lib/api/projects';

function isProjectInTrash(project: FullProject): boolean {
  return project.trashedAt != null;
}

interface UseProjectDetailHeaderOptions {
  project: FullProject | null;
  onProjectUpdated: (project: FullProject) => void;
}

/** Editable project name in the app top bar; Trash badge when applicable. */
export function useProjectDetailHeader({
  project,
  onProjectUpdated,
}: UseProjectDetailHeaderOptions): void {
  useHeaderModuleTitle(null);
  usePageDocumentTitle(project?.name ?? '');

  const handleCommitName = useCallback(
    async (trimmed: string) => {
      if (!project) return;
      try {
        const updated = await projectsApi.update(project.id, { name: trimmed });
        onProjectUpdated(updated);
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Project name could not be updated.'));
        throw caught;
      }
    },
    [onProjectUpdated, project],
  );

  const headerContext = useMemo(() => {
    if (!project) return null;
    const inTrash = isProjectInTrash(project);
    return {
      kind: 'custom' as const,
      node: (
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
          <InlineEditableEntityTitle
            value={project.name}
            onCommit={handleCommitName}
            editHint="Click to edit project name"
            disabled={inTrash}
            titleClassName={HEADER_MODULE_TITLE_LABEL}
          />
          {inTrash ? (
            <StatusBadge
              label="In Trash"
              variant="zinc"
              className={HEADER_CONTEXT_STATUS_BADGE_CLASS}
            />
          ) : null}
        </div>
      ),
    };
  }, [handleCommitName, project]);

  useHeaderContext(headerContext);
}
