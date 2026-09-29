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
import { useClientMessengerOverlayOptional } from '@/features/messenger-client/client-messenger-overlay-context';
import { clientSectionFromPathname } from '@/features/messenger-client/client-messenger-section';

export function SidebarChildNavList({
  item,
  pathname,
}: {
  item: NavModuleDefinition;
  pathname: string;
}) {
  const t = useTranslations('navigation');
  const messengerOverlay = useMessengerOverlayOptional();
  const clientOverlay = useClientMessengerOverlayOptional();

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
        const childActive = sheetChildActive(
          item.key,
          child.href,
          pathname,
          child,
          messengerOverlay,
          clientOverlay,
        );
        if (item.key === 'messenger' && messengerOverlay) {
          return (
            <li key={child.href}>
              <SheetChildButton
                label={childLabel}
                active={childActive}
                onClick={() => {
                  clientOverlay?.closeClientMessenger();
                  messengerOverlay.openMessenger(sectionFromPathname(child.href));
                }}
              />
            </li>
          );
        }
        if (item.key === 'client-messenger' && clientOverlay) {
          return (
            <li key={child.href}>
              <SheetChildButton
                label={childLabel}
                active={childActive}
                onClick={() => {
                  messengerOverlay?.closeMessenger();
                  clientOverlay.openClientMessenger(clientSectionFromPathname(child.href));
                }}
              />
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

function SheetChildButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        SIDEBAR_NAV_CHILD_LINK_CLASS,
        'w-full text-left',
        active
          ? 'text-sidebar-foreground font-medium'
          : 'text-sidebar-muted hover:text-sidebar-foreground',
      )}
    >
      {label}
    </button>
  );
}

function sheetChildActive(
  moduleKey: string,
  href: string,
  pathname: string,
  child: Parameters<typeof isNavChildLinkActive>[1],
  messengerOverlay: ReturnType<typeof useMessengerOverlayOptional>,
  clientOverlay: ReturnType<typeof useClientMessengerOverlayOptional>,
): boolean {
  if (moduleKey === 'messenger' && messengerOverlay?.isOpen) {
    return sectionFromPathname(href) === messengerOverlay.section;
  }
  if (moduleKey === 'client-messenger' && clientOverlay?.isOpen) {
    return clientSectionFromPathname(href) === clientOverlay.section;
  }
  return isNavChildLinkActive(pathname, child, moduleKey);
}
