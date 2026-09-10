'use client';

import { useMemo } from 'react';
import { useHeaderContext, useHeaderModuleTitle } from '@/components/layout/header-context';
import {
  HEADER_CONTEXT_STATUS_BADGE_CLASS,
  HEADER_MODULE_TITLE_LABEL,
} from '@/components/layout/header-context/header-module-title-constants';
import { StatusBadge } from '@/components/shared';
import { usePageDocumentTitle } from '@/features/account/hooks/use-page-document-title';
import {
  DetailPageMobileBackLink,
  DETAIL_PAGE_MOBILE_BACK_ROW_CLASS,
} from '@/features/projects/components/DetailPageMobileBackLink';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import type { WorkSpace } from '@/lib/api/tasks';
import { WORK_SPACES_DIRECTORY_PATH } from './work-spaces-directory-tab';
import { getWorkSpaceTypeLabel, getWorkSpaceTypeVariant } from './work-space-utils';

/** Workspace name + type/mode badges in the app header (mobile: Back → title | statuses). */
export function useWorkSpaceDetailHeader(workspace: WorkSpace | null): void {
  const isMobileViewport = useIsMobileViewport();
  useHeaderModuleTitle(null, isMobileViewport);
  usePageDocumentTitle(workspace?.name ?? '');

  const headerContext = useMemo(() => {
    if (!workspace) return null;

    const statuses = (
      <div className="flex shrink-0 items-center gap-1.5">
        <StatusBadge
          label={getWorkSpaceTypeLabel(workspace.type)}
          variant={getWorkSpaceTypeVariant(workspace.type)}
          className={HEADER_CONTEXT_STATUS_BADGE_CLASS}
        />
        <StatusBadge
          label={workspace.scrumEnabled ? 'Scrum' : 'Kanban'}
          variant={workspace.scrumEnabled ? 'blue' : 'gray'}
          className={HEADER_CONTEXT_STATUS_BADGE_CLASS}
        />
      </div>
    );

    const title = (
      <h1 className={HEADER_MODULE_TITLE_LABEL} title={workspace.name}>
        {workspace.name}
      </h1>
    );

    if (isMobileViewport) {
      return {
        kind: 'custom' as const,
        node: (
          <div className="flex w-full min-w-0 flex-col gap-2.5">
            <div className={DETAIL_PAGE_MOBILE_BACK_ROW_CLASS}>
              <DetailPageMobileBackLink
                href={WORK_SPACES_DIRECTORY_PATH}
                ariaLabel="Back to work spaces"
              />
            </div>
            <div className="flex w-full min-w-0 items-center gap-2">
              <div className="min-w-0 flex-1 overflow-hidden">{title}</div>
              {statuses}
            </div>
          </div>
        ),
      };
    }

    return {
      kind: 'custom' as const,
      node: <div className="flex flex-wrap items-center gap-2">{statuses}</div>,
    };
  }, [isMobileViewport, workspace]);

  useHeaderContext(headerContext);
}
