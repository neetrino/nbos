'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { isNavChildGroup, type NavModuleDefinition } from '@/lib/navigation/nav-config';
import { isRegisteredModuleKey } from '@/lib/navigation/module-last-visit';
import { isNavChildLinkActive } from '@/lib/navigation/nav-route-utils';
import { ModuleSectionNavLink } from './ModuleSectionNavLink';
import {
  SIDEBAR_NAV_CHILD_LINK_CLASS,
  SIDEBAR_NAV_CHILD_LIST_CLASS,
} from './sidebar-layout-constants';
import { useTranslations } from 'next-intl';
import { useMessengerOverlayOptional } from '@/features/messenger-internal/messenger-overlay-context';
import { sectionFromPathname } from '@/features/messenger-internal/internal-messenger-section';

export function SidebarChildNavList({
  item,
  pathname,
}: {
  item: NavModuleDefinition;
  pathname: string;
}) {
  const t = useTranslations('navigation');
  const messengerOverlay = useMessengerOverlayOptional();

  if (!item.children) return null;

  return (
    <ul className={SIDEBAR_NAV_CHILD_LIST_CLASS}>
      {item.children.map((child) => {
        const childLabel = t(child.label);

        if (isNavChildGroup(child)) {
          return (
            <li key={`group-${child.label}`}>
              <span
                className={cn(
                  SIDEBAR_NAV_CHILD_LINK_CLASS,
                  'text-sidebar-muted pointer-events-none pt-2 text-xs font-semibold tracking-wide uppercase',
                )}
              >
                {childLabel}
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
              label={childLabel}
              fallbackHref={child.href}
              pathname={pathname}
            />
          );
        }
        const childActive =
          item.key === 'messenger' && messengerOverlay?.isOpen
            ? sectionFromPathname(child.href) === messengerOverlay.section
            : isNavChildLinkActive(pathname, child, item.key);
        if (item.key === 'messenger' && messengerOverlay) {
          return (
            <li key={child.href}>
              <button
                type="button"
                onClick={() => messengerOverlay.openMessenger(sectionFromPathname(child.href))}
                className={cn(
                  SIDEBAR_NAV_CHILD_LINK_CLASS,
                  'w-full text-left',
                  childActive
                    ? 'text-sidebar-foreground font-medium'
                    : 'text-sidebar-muted hover:text-sidebar-foreground',
                )}
              >
                {childLabel}
              </button>
            </li>
          );
        }
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
              {childLabel}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
