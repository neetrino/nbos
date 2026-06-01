'use client';

import { useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ExternalLink, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SIDEBAR_NAV_CHILD_LINK_CLASS,
  SIDEBAR_NAV_CHILD_LIST_CLASS,
  SIDEBAR_NAV_ITEM_CLASS,
} from './sidebar-layout-constants';
import {
  isNavChildGroup,
  isNavChildLink,
  type NavModuleDefinition,
} from '@/lib/navigation/nav-config';
import type { DashboardPersonalLink } from '@/lib/api/dashboard';
import { ModuleSectionNavLink } from './ModuleSectionNavLink';
import { useModuleEntryHref } from '@/lib/navigation/hooks/use-module-entry-href';
import { writeModuleLastVisitFromPathname } from '@/lib/navigation/module-last-visit';
import {
  getFirstChildHref,
  getPathFromHref,
  isNavChildLinkActive,
} from '@/lib/navigation/nav-route-utils';
import { isRegisteredModuleKey } from '@/lib/navigation/module-last-visit';
import { SidebarModuleIcon, SidebarModuleMarker } from './SidebarModuleIcon';

interface SidebarNavListProps {
  collapsed: boolean;
  primaryItems: NavModuleDefinition[];
  hiddenItems: NavModuleDefinition[];
  personalLinks: DashboardPersonalLink[];
  moreExpanded: boolean;
  onToggleMore: () => void;
}

export function SidebarNavList({
  collapsed,
  primaryItems,
  hiddenItems,
  personalLinks,
  moreExpanded,
  onToggleMore,
}: SidebarNavListProps) {
  const pathname = usePathname();

  useLayoutEffect(() => {
    writeModuleLastVisitFromPathname(pathname);
  }, [pathname]);

  const [manualExpanded, setManualExpanded] = useState<{ key: string; pathname: string } | null>(
    null,
  );

  const activeSectionKey =
    primaryItems
      .concat(hiddenItems)
      .find(
        (item) =>
          item.children?.some(
            (child) => isNavChildLink(child) && isNavChildLinkActive(pathname, child, item.key),
          ) ?? false,
      )?.key ?? null;

  const expandedKey = manualExpanded?.pathname === pathname ? manualExpanded.key : activeSectionKey;

  const toggleExpanded = (key: string) => {
    setManualExpanded((current) =>
      current?.key === key && current.pathname === pathname ? null : { key, pathname },
    );
  };

  const expandOnly = (key: string) => {
    setManualExpanded({ key, pathname });
  };

  const [linksExpanded, setLinksExpanded] = useState(false);

  return (
    <ul className="space-y-0">
      {primaryItems.map((item) => (
        <ModuleNavRow
          key={item.key}
          item={item}
          collapsed={collapsed}
          pathname={pathname}
          expanded={expandedKey === item.key}
          onToggleExpanded={() => toggleExpanded(item.key)}
          onExpandOnly={() => expandOnly(item.key)}
        />
      ))}

      {personalLinks.length > 0 && !collapsed && (
        <li className="pt-1">
          <button
            type="button"
            onClick={() => setLinksExpanded((value) => !value)}
            className="text-sidebar-muted hover:text-sidebar-foreground flex w-full items-center justify-between rounded-md px-2 py-1 text-[13px] font-medium"
          >
            <span className="flex items-center gap-2">
              <Link2 size={16} className="shrink-0 opacity-80" />
              My Links
            </span>
            <ChevronLeft
              size={14}
              className={cn('transition-transform', linksExpanded && '-rotate-90')}
            />
          </button>
          {linksExpanded && (
            <ul className="mt-0.5 space-y-0.5">
              {personalLinks.map((link) => (
                <PersonalLinkRow key={link.id} link={link} />
              ))}
            </ul>
          )}
        </li>
      )}

      {hiddenItems.length > 0 && (
        <li className="pt-2">
          {collapsed ? (
            <button
              type="button"
              title="More / Hidden"
              onClick={onToggleMore}
              className="text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground flex w-full justify-center rounded-md px-2 py-1 text-sm"
            >
              ···
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onToggleMore}
                className="text-sidebar-muted hover:text-sidebar-foreground flex w-full items-center justify-between rounded-md px-2 py-1 text-[11px] font-semibold tracking-wide uppercase"
              >
                <span>More / Hidden</span>
                <ChevronLeft
                  size={14}
                  className={cn('transition-transform', moreExpanded && '-rotate-90')}
                />
              </button>
              {moreExpanded && (
                <ul className="mt-1 space-y-0.5">
                  {hiddenItems.map((item) => (
                    <ModuleNavRow
                      key={item.key}
                      item={item}
                      collapsed={collapsed}
                      pathname={pathname}
                      expanded={expandedKey === item.key}
                      onToggleExpanded={() => toggleExpanded(item.key)}
                      onExpandOnly={() => expandOnly(item.key)}
                      muted
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </li>
      )}
    </ul>
  );
}

function PersonalLinkRow({ link }: { link: DashboardPersonalLink }) {
  const className =
    'text-sidebar-muted hover:text-sidebar-foreground flex items-center gap-2 rounded-md px-3 py-1 text-[13px] transition-colors';

  if (link.isExternal) {
    return (
      <li>
        <a
          href={link.url}
          target={link.openInNewTab ? '_blank' : undefined}
          rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
          className={className}
        >
          <span className="truncate">{link.label}</span>
          <ExternalLink size={14} className="shrink-0 opacity-70" />
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link href={link.url} className={className}>
        <span className="truncate">{link.label}</span>
      </Link>
    </li>
  );
}

function ModuleNavRow({
  item,
  collapsed,
  pathname,
  expanded,
  onToggleExpanded,
  onExpandOnly,
  muted = false,
}: {
  item: NavModuleDefinition;
  collapsed: boolean;
  pathname: string;
  expanded: boolean;
  onToggleExpanded: () => void;
  onExpandOnly: () => void;
  muted?: boolean;
}) {
  const moduleEntryHref = useModuleEntryHref(item.key, item.href, pathname);
  const moduleHref = isRegisteredModuleKey(item.key) ? moduleEntryHref : item.href;
  const childPathActive =
    item.children?.some(
      (child) => isNavChildLink(child) && isNavChildLinkActive(pathname, child, item.key),
    ) ?? false;
  const active =
    childPathActive || pathname.startsWith(item.href) || pathname.startsWith(moduleHref);
  const firstChildHref = isRegisteredModuleKey(item.key)
    ? moduleEntryHref
    : getFirstChildHref(item);

  if (!item.children) {
    const isActive = active && !muted;
    return (
      <li>
        <Link
          href={moduleHref}
          title={item.label}
          className={navLinkClass(isActive, collapsed, muted)}
        >
          <SidebarModuleMarker moduleKey={item.key} visible={isActive} />
          <SidebarModuleIcon moduleKey={item.key} active={isActive} muted={muted} />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
      </li>
    );
  }

  const isActive = active && !muted;

  return (
    <li>
      {collapsed ? (
        <Link
          href={firstChildHref}
          onClick={onExpandOnly}
          title={item.label}
          className={navLinkClass(isActive, collapsed, muted)}
        >
          <SidebarModuleMarker moduleKey={item.key} visible={isActive} />
          <SidebarModuleIcon moduleKey={item.key} active={isActive} muted={muted} />
        </Link>
      ) : (
        <>
          <div
            className={cn(
              'group relative flex w-full items-stretch overflow-hidden rounded-md transition-colors',
              isActive ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-muted',
            )}
          >
            <SidebarModuleMarker moduleKey={item.key} visible={isActive} />
            <Link
              href={firstChildHref}
              onClick={onExpandOnly}
              className={cn(
                `${SIDEBAR_NAV_ITEM_CLASS} flex min-w-0 flex-1 items-center gap-2 text-[13px] font-medium transition-colors`,
                isActive
                  ? 'text-sidebar-foreground'
                  : 'hover:bg-secondary/50 hover:text-sidebar-foreground',
              )}
            >
              <SidebarModuleIcon moduleKey={item.key} active={isActive} muted={muted} />
              <span className="truncate">{item.label}</span>
            </Link>
            <button
              type="button"
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse submenu' : 'Expand submenu'}
              onClick={(event) => {
                event.preventDefault();
                onToggleExpanded();
              }}
              className={cn(
                'text-sidebar-muted hover:text-sidebar-foreground flex shrink-0 items-center px-1.5 transition-colors',
                isActive && 'text-sidebar-foreground',
              )}
            >
              <ChevronLeft
                size={14}
                className={cn('transition-transform', expanded && '-rotate-90')}
              />
            </button>
          </div>
          {expanded && (
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
          )}
        </>
      )}
    </li>
  );
}

function navLinkClass(active: boolean, collapsed: boolean, muted: boolean): string {
  return cn(
    'group relative flex items-center gap-2 rounded-md text-[13px] font-medium transition-colors duration-150',
    SIDEBAR_NAV_ITEM_CLASS,
    active
      ? 'bg-sidebar-accent text-sidebar-foreground'
      : 'text-sidebar-muted hover:bg-secondary/50 hover:text-sidebar-foreground',
    muted && !active && 'opacity-60',
    collapsed && 'justify-center px-1.5 py-1',
  );
}
