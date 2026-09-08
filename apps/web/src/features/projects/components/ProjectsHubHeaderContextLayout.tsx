'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  useHeaderContextLayout,
  type HeaderContextContent,
  type HeaderNavItem,
} from '@/components/layout/header-context';
import { PROJECT_HUB_HEADER_ZONE_ACCENTS } from '@/features/projects/constants/projects-header-zone-accents';
import { PROJECT_HUB_HEADER_ZONES } from '@/features/projects/constants/projects-header-zones';
import { useModuleSectionHref } from '@/lib/navigation/hooks/use-module-section-href';
import {
  isProjectHubDirectoryPath,
  isProjectHubSectionPath,
  PROJECT_HUB_SECTION_DEFAULTS,
  type ProjectHubSectionId,
} from '@/lib/navigation/module-last-visit/project-hub-module-last-visit';

function projectHubHeaderContent(
  pathname: string,
  hrefByZone: Record<ProjectHubSectionId, string>,
): HeaderContextContent | null {
  if (!isProjectHubDirectoryPath(pathname)) return null;

  const items: HeaderNavItem[] = PROJECT_HUB_HEADER_ZONES.map((zone) => ({
    label: zone.label,
    href: hrefByZone[zone.zone],
    isActive: (path) => isProjectHubSectionPath(path, zone.zone),
    accent: PROJECT_HUB_HEADER_ZONE_ACCENTS[zone.zone],
  }));

  return {
    kind: 'nav',
    ariaLabel: 'Project Hub areas',
    items,
  };
}

export function ProjectsHubHeaderContextLayout() {
  const pathname = usePathname();
  const projectsHref = useModuleSectionHref(
    'project-hub',
    'projects',
    PROJECT_HUB_SECTION_DEFAULTS.projects,
    pathname,
  );
  const productsHref = useModuleSectionHref(
    'project-hub',
    'products',
    PROJECT_HUB_SECTION_DEFAULTS.products,
    pathname,
  );

  const content = useMemo(
    () => projectHubHeaderContent(pathname, { projects: projectsHref, products: productsHref }),
    [pathname, productsHref, projectsHref],
  );

  useHeaderContextLayout(content);

  return null;
}
