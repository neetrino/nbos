'use client';

import { useLayoutEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  useHeaderContextLayout,
  type HeaderContextContent,
  type HeaderNavItem,
} from '@/components/layout/header-context';
import { PROJECT_HUB_HEADER_ZONE_ACCENTS } from '@/features/projects/constants/projects-header-zone-accents';
import { PROJECT_HUB_HEADER_ZONES } from '@/features/projects/constants/projects-header-zones';
import {
  isProjectHubDirectoryPath,
  isProjectHubSectionPath,
  PROJECT_HUB_SECTION_DEFAULTS,
  readProjectHubSectionHref,
} from '@/lib/navigation/module-last-visit/project-hub-module-last-visit';

export function ProjectsHubHeaderContextLayout() {
  const pathname = usePathname();
  const [visitReady, setVisitReady] = useState(false);

  useLayoutEffect(() => {
    setVisitReady(true);
  }, []);

  const content = useMemo((): HeaderContextContent | null => {
    if (!isProjectHubDirectoryPath(pathname)) {
      return null;
    }

    const items: HeaderNavItem[] = PROJECT_HUB_HEADER_ZONES.map((zone) => ({
      label: zone.label,
      href: visitReady
        ? readProjectHubSectionHref(zone.zone)
        : PROJECT_HUB_SECTION_DEFAULTS[zone.zone],
      isActive: (path) => isProjectHubSectionPath(path, zone.zone),
      accent: PROJECT_HUB_HEADER_ZONE_ACCENTS[zone.zone],
    }));

    return {
      kind: 'nav',
      ariaLabel: 'Project Hub areas',
      items,
    };
  }, [pathname, visitReady]);

  useHeaderContextLayout(content);

  return null;
}
