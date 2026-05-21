'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SIDEBAR_NAV_CHILD_LINK_CLASS } from './sidebar-layout-constants';
import { useModuleSectionHref } from '@/lib/navigation/hooks/use-module-section-href';
import {
  isPathInModuleSection,
  type RegisteredModuleKey,
} from '@/lib/navigation/module-last-visit';

type ModuleSectionNavLinkProps = {
  moduleKey: RegisteredModuleKey;
  sectionId: string;
  label: string;
  fallbackHref: string;
  pathname: string;
};

export function ModuleSectionNavLink({
  moduleKey,
  sectionId,
  label,
  fallbackHref,
  pathname,
}: ModuleSectionNavLinkProps) {
  const href = useModuleSectionHref(moduleKey, sectionId, fallbackHref, pathname);
  const active = isPathInModuleSection(moduleKey, pathname, sectionId);

  return (
    <li>
      <Link
        href={href}
        className={cn(
          SIDEBAR_NAV_CHILD_LINK_CLASS,
          active
            ? 'text-sidebar-foreground font-medium'
            : 'text-sidebar-muted hover:text-sidebar-foreground',
        )}
      >
        {label}
      </Link>
    </li>
  );
}
