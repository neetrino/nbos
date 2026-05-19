'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ExternalLink, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SIDEBAR_NAV_CHILD_LINK_CLASS,
  SIDEBAR_NAV_CHILD_LIST_CLASS,
  SIDEBAR_NAV_ITEM_CLASS,
} from './sidebar-layout-constants';
import type { NavModuleDefinition } from '@/lib/navigation/nav-config';
import type { DashboardPersonalLink } from '@/lib/api/dashboard';
import {
  getFirstChildHref,
  getPathFromHref,
  isChildRouteActive,
} from '@/lib/navigation/nav-route-utils';
import { getSidebarNavIcon } from './sidebar-nav-icons';

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
  const [manualExpanded, setManualExpanded] = useState<{ key: string; pathname: string } | null>(
    null,
  );

  const activeSectionKey =
    primaryItems
      .concat(hiddenItems)
      .find(
        (item) => item.children?.some((child) => isChildRouteActive(pathname, child.href)) ?? false,
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
    <ul className="space-y-1">
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
            className="text-sidebar-muted hover:text-sidebar-foreground flex w-full items-center justify-between rounded-lg px-4 py-2 text-sm font-medium"
          >
            <span className="flex items-center gap-3">
              <Link2 size={18} className="shrink-0 opacity-80" />
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
              className="text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground flex w-full justify-center rounded-lg px-2 py-2 text-sm"
            >
              ···
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onToggleMore}
                className="text-sidebar-muted hover:text-sidebar-foreground flex w-full items-center justify-between rounded-lg px-4 py-2 text-xs font-semibold tracking-wide uppercase"
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
    'text-sidebar-muted hover:text-sidebar-foreground flex items-center gap-2 rounded-md px-4 py-1.5 text-sm transition-colors';

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
  const icon = getSidebarNavIcon(item.key);
  const childPathActive =
    item.children?.some((child) => isChildRouteActive(pathname, child.href)) ?? false;
  const active = childPathActive || pathname.startsWith(item.href);
  const firstChildHref = getFirstChildHref(item);

  if (!item.children) {
    return (
      <li>
        <Link
          href={item.href}
          title={item.label}
          className={navLinkClass(active && !muted, collapsed, muted)}
        >
          {icon}
          {!collapsed && <span>{item.label}</span>}
        </Link>
      </li>
    );
  }

  return (
    <li>
      {collapsed ? (
        <Link
          href={firstChildHref}
          onClick={onExpandOnly}
          title={item.label}
          className={navLinkClass(active && !muted, collapsed, muted)}
        >
          {icon}
        </Link>
      ) : (
        <>
          <div
            className={cn(
              'flex w-full items-stretch gap-0 overflow-hidden rounded-lg',
              active && !muted && 'bg-sidebar-accent text-sidebar-foreground',
            )}
          >
            <Link
              href={firstChildHref}
              onClick={onExpandOnly}
              className={cn(
                `${SIDEBAR_NAV_ITEM_CLASS} flex min-w-0 flex-1 items-center gap-3 text-sm font-medium transition-colors`,
                active
                  ? 'text-sidebar-foreground'
                  : 'text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground',
              )}
            >
              {icon}
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
                'text-sidebar-muted hover:text-sidebar-foreground flex shrink-0 items-center px-2 transition-colors',
                active && 'text-sidebar-foreground',
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
    'flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
    SIDEBAR_NAV_ITEM_CLASS,
    active
      ? 'bg-sidebar-accent text-sidebar-foreground'
      : 'text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground',
    muted && !active && 'opacity-75',
    collapsed && 'justify-center px-2',
  );
}
