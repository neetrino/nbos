'use client';

import { useMemo } from 'react';
import { useHeaderContext } from '@/components/layout/header-context';
import { StatusBadge } from '@/components/shared';
import type { WorkSpace } from '@/lib/api/tasks';
import { getWorkSpaceTypeLabel, getWorkSpaceTypeVariant } from './work-space-utils';

/** Workspace type + mode badges in the app header, next to the module title from PageHero. */
export function useWorkSpaceDetailHeader(workspace: WorkSpace | null): void {
  const headerContext = useMemo(() => {
    if (!workspace) return null;
    return {
      kind: 'custom' as const,
      node: (
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={getWorkSpaceTypeLabel(workspace.type)}
            variant={getWorkSpaceTypeVariant(workspace.type)}
          />
          <StatusBadge
            label={workspace.scrumEnabled ? 'Scrum' : 'Kanban'}
            variant={workspace.scrumEnabled ? 'blue' : 'gray'}
          />
        </div>
      ),
    };
  }, [workspace]);

  useHeaderContext(headerContext);
}
