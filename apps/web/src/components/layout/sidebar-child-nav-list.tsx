'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  isNavChildGroup,
  type NavModuleDefinition,
} from '@/lib/navigation/nav-config';
import { isRegisteredModuleKey } from '@/lib/navigation/module-last-visit';
import { getPathFromHref } from '@/lib/navigation/nav-route-utils';
import { ModuleSectionNavLink } from './ModuleSectionNavLink';
import { SIDEBAR_NAV_CHILD_LINK_CLASS, SIDEBAR_NAV_CHILD_LIST_CLASS } from './sidebar-layout-constants';

export function SidebarChildNavList({
  item,
  pathname,
}: {
  item: NavModuleDefinition;
  pathname: string;
}) {
  if (!item.children) return null;

  return (
    <ul className={SIDEBAR_NAV_CHILD_LIST_CLASS}>
      {item.children.map((child) => {
        if (isNavChildGroup(child)) {
          return (
            <li key={`group-${child.label}`}>
              <span
                className={cn(
                  SIDEBAR_NAV_CHILD_LINK_CLASS,
                  'text-sidebar-muted pointer-events-none pt-2 text-xs font-semibold tracking-wide uppercase',
                )}
              >
                {child.label}
              </span>
            </li>
          );
        }
        if (child.navSection && isRegisteredModuleKey(item.key)) {
          return (
            <ModuleSectionNavLink
              key={`${item.key}-${child.navSection}`}
              moduleKey={item.key}
              sectionId={child.navSection}
              label={child.label}
              fallbackHref={child.href}
              pathname={pathname}
            />
          );
        }
        const childPath = getPathFromHref(child.href);
        const childActive = pathname === childPath || pathname.startsWith(`${childPath}/`);
        return (
          <li key={child.href}>
            <Link
              href={child.href}
              className={cn(
                SIDEBAR_NAV_CHILD_LINK_CLASS,
                childActive
                  ? 'text-sidebar-foreground font-medium'
                  : 'text-sidebar-muted hover:text-sidebar-foreground',
              )}
            >
              {child.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
