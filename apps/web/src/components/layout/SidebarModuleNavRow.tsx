'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
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
import { ModuleSectionNavLink } from './ModuleSectionNavLink';
import { useModuleEntryHref } from '@/lib/navigation/hooks/use-module-entry-href';
import {
  getFirstChildHref,
  getPathFromHref,
  isNavChildLinkActive,
} from '@/lib/navigation/nav-route-utils';
import { isRegisteredModuleKey } from '@/lib/navigation/module-last-visit';
import { SidebarModuleIcon, SidebarModuleMarker } from './SidebarModuleIcon';
import { SidebarNavQuickActionButton } from './SidebarNavQuickActionButton';

interface SidebarModuleNavRowProps {
  item: NavModuleDefinition;
  collapsed: boolean;
  pathname: string;
  expanded: boolean;
  onToggleExpanded: () => void;
  onExpandOnly: () => void;
  onQuickAction?: (action: NonNullable<NavModuleDefinition['quickAction']>) => void;
  muted?: boolean;
}

export function SidebarModuleNavRow({
  item,
  collapsed,
  pathname,
  expanded,
  onToggleExpanded,
  onExpandOnly,
  onQuickAction,
  muted = false,
}: SidebarModuleNavRowProps) {
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
  const isActive = active && !muted;

  if (!item.children) {
    return (
      <LeafModuleNavRow
        item={item}
        collapsed={collapsed}
        isActive={isActive}
        muted={muted}
        moduleHref={moduleHref}
        onQuickAction={onQuickAction}
      />
    );
  }

  return (
    <ParentModuleNavRow
      item={item}
      collapsed={collapsed}
      isActive={isActive}
      muted={muted}
      firstChildHref={firstChildHref}
      expanded={expanded}
      pathname={pathname}
      onToggleExpanded={onToggleExpanded}
      onExpandOnly={onExpandOnly}
    />
  );
}

function ParentModuleNavRow({
  item,
  collapsed,
  isActive,
  muted,
  firstChildHref,
  expanded,
  pathname,
  onToggleExpanded,
  onExpandOnly,
}: {
  item: NavModuleDefinition;
  collapsed: boolean;
  isActive: boolean;
  muted: boolean;
  firstChildHref: string;
  expanded: boolean;
  pathname: string;
  onToggleExpanded: () => void;
  onExpandOnly: () => void;
}) {
  if (collapsed) {
    return (
      <li>
        <Link
          href={firstChildHref}
          onClick={onExpandOnly}
          title={item.label}
          className={navLinkClass(isActive, collapsed, muted)}
        >
          <SidebarModuleMarker moduleKey={item.key} visible={isActive} />
          <SidebarModuleIcon moduleKey={item.key} active={isActive} muted={muted} />
        </Link>
      </li>
    );
  }

  return (
    <li>
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
          <ChevronLeft size={14} className={cn('transition-transform', expanded && '-rotate-90')} />
        </button>
      </div>
      {expanded ? <ChildNavList item={item} pathname={pathname} /> : null}
    </li>
  );
}

function LeafModuleNavRow({
  item,
  collapsed,
  isActive,
  muted,
  moduleHref,
  onQuickAction,
}: {
  item: NavModuleDefinition;
  collapsed: boolean;
  isActive: boolean;
  muted: boolean;
  moduleHref: string;
  onQuickAction?: (action: NonNullable<NavModuleDefinition['quickAction']>) => void;
}) {
  const quickAction = item.quickAction;
  if (!quickAction || !onQuickAction || collapsed) {
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

  return (
    <li>
      <div
        className={cn(
          'group relative flex w-full items-stretch overflow-hidden rounded-md transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-foreground'
            : 'text-sidebar-muted hover:bg-secondary/50 hover:text-sidebar-foreground',
          muted && !isActive && 'opacity-60',
        )}
      >
        <Link
          href={moduleHref}
          title={item.label}
          className={cn(
            `${SIDEBAR_NAV_ITEM_CLASS} flex min-w-0 flex-1 items-center gap-2 text-[13px] font-medium transition-colors`,
            isActive ? 'text-sidebar-foreground' : 'hover:text-sidebar-foreground',
          )}
        >
          <SidebarModuleMarker moduleKey={item.key} visible={isActive} />
          <SidebarModuleIcon moduleKey={item.key} active={isActive} muted={muted} />
          <span className="truncate">{item.label}</span>
        </Link>
        <SidebarNavQuickActionButton onAction={() => onQuickAction(quickAction)} />
      </div>
    </li>
  );
}

function ChildNavList({ item, pathname }: { item: NavModuleDefinition; pathname: string }) {
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
