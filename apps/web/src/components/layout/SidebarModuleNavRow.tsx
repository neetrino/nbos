'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SIDEBAR_NAV_ITEM_CLASS } from './sidebar-layout-constants';
import {
  isNavChildLink,
  type NavModuleDefinition,
} from '@/lib/navigation/nav-config';
import { useModuleEntryHref } from '@/lib/navigation/hooks/use-module-entry-href';
import {
  getFirstChildHref,
  isNavChildLinkActive,
} from '@/lib/navigation/nav-route-utils';
import { isRegisteredModuleKey } from '@/lib/navigation/module-last-visit';
import { SidebarModuleIcon, SidebarModuleMarker } from './SidebarModuleIcon';
import { SidebarNavQuickActionButton } from './SidebarNavQuickActionButton';
import { SidebarChildNavList } from './sidebar-child-nav-list';
import { useMessengerBootstrapPrefetch } from '@/features/messenger/persist/use-messenger-bootstrap-prefetch';

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
  const prefetchMessenger = useMessengerBootstrapPrefetch(item.key);
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
        onPrefetch={prefetchMessenger}
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
      onPrefetch={prefetchMessenger}
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
  onPrefetch,
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
  onPrefetch: () => void;
}) {
  if (collapsed) {
    return (
      <li className="relative z-[1]" onPointerEnter={onPrefetch} onFocusCapture={onPrefetch}>
        <Link
          href={firstChildHref}
          onClick={onExpandOnly}
          title={item.label}
          data-sidebar-nav-active={isActive ? 'true' : undefined}
          className={navLinkClass(isActive, collapsed, muted)}
        >
          <SidebarModuleMarker moduleKey={item.key} visible={isActive} />
          <SidebarModuleIcon moduleKey={item.key} active={isActive} muted={muted} />
        </Link>
      </li>
    );
  }

  return (
    <li className="relative z-[1]" onPointerEnter={onPrefetch} onFocusCapture={onPrefetch}>
      <div
        data-sidebar-nav-active={isActive ? 'true' : undefined}
        className={cn(
          'group relative flex w-full items-center overflow-hidden rounded-md transition-colors',
          isActive ? 'text-sidebar-foreground' : 'text-sidebar-muted',
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
      {expanded ? <SidebarChildNavList item={item} pathname={pathname} /> : null}
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
  onPrefetch,
}: {
  item: NavModuleDefinition;
  collapsed: boolean;
  isActive: boolean;
  muted: boolean;
  moduleHref: string;
  onQuickAction?: (action: NonNullable<NavModuleDefinition['quickAction']>) => void;
  onPrefetch: () => void;
}) {
  const quickAction = item.quickAction;
  if (!quickAction || !onQuickAction || collapsed) {
    return (
      <li className="relative z-[1]" onPointerEnter={onPrefetch} onFocusCapture={onPrefetch}>
        <Link
          href={moduleHref}
          title={item.label}
          data-sidebar-nav-active={isActive ? 'true' : undefined}
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
    <li className="relative z-[1]" onPointerEnter={onPrefetch} onFocusCapture={onPrefetch}>
      <div
        data-sidebar-nav-active={isActive ? 'true' : undefined}
        className={cn(
          'group relative flex w-full items-center overflow-hidden rounded-md transition-colors',
          isActive
            ? 'text-sidebar-foreground'
            : 'text-sidebar-muted hover:bg-secondary/50 hover:text-sidebar-foreground',
          muted && !isActive && 'opacity-60',
        )}
      >
        <SidebarModuleMarker moduleKey={item.key} visible={isActive} />
        <Link
          href={moduleHref}
          title={item.label}
          className={cn(
            `${SIDEBAR_NAV_ITEM_CLASS} flex min-w-0 flex-1 items-center gap-2 text-[13px] font-medium transition-colors`,
            isActive ? 'text-sidebar-foreground' : 'hover:text-sidebar-foreground',
          )}
        >
          <SidebarModuleIcon moduleKey={item.key} active={isActive} muted={muted} />
          <span className="truncate">{item.label}</span>
        </Link>
        <SidebarNavQuickActionButton onAction={() => onQuickAction(quickAction)} />
      </div>
    </li>
  );
}

function navLinkClass(active: boolean, collapsed: boolean, muted: boolean): string {
  return cn(
    'group relative flex items-center gap-2 rounded-md text-[13px] font-medium transition-colors duration-150',
    SIDEBAR_NAV_ITEM_CLASS,
    active
      ? 'text-sidebar-foreground'
      : 'text-sidebar-muted hover:bg-secondary/50 hover:text-sidebar-foreground',
    muted && !active && 'opacity-60',
    collapsed && 'justify-center px-1.5 py-1',
  );
}
