'use client';

import { useRef, useState } from 'react';
import { LayoutGrid, Plus } from 'lucide-react';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { cn } from '@/lib/utils';
import { MobileDockOverflowSheet } from './MobileDockOverflowSheet';
import { MobileDockItem } from './MobileDockItem';
import { MobileDockSwitcherButton } from './MobileDockSwitcherButton';
import { MobilePageSearchSheet } from './MobilePageSearchSheet';
import { useMobileModuleDockResolved } from './MobileModuleDockProvider';
import { usePageHeroDockCreate } from './use-page-hero-dock-create';
import {
  MOBILE_DOCK_HEIGHT_CLASS,
  MOBILE_DOCK_ICON_SIZE_PX,
  MOBILE_DOCK_ROW_CLASS,
} from './mobile-bottom-nav-constants';
import {
  MOBILE_WORKSPACE_CREATE_LABEL,
  MOBILE_WORKSPACE_SWITCHER_MULTI_TITLE,
} from './mobile-workspace-dock-constants';
import type { MobileDockCreateAction } from './mobile-module-dock-types';

interface MobileWorkspaceDockProps {
  menuOpen?: boolean;
  onMoreClick: () => void;
}

export function MobileWorkspaceDock({ menuOpen = false, onMoreClick }: MobileWorkspaceDockProps) {
  const { switcherGroups, switcherItem, create, settings, hasSearch, hasSettings, getTools } =
    useMobileModuleDockResolved();
  const tools = getTools();
  const isMobileViewport = useIsMobileViewport();
  const trailingHostRef = useRef<HTMLDivElement>(null);
  const resolvedCreate = usePageHeroDockCreate(trailingHostRef, create);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherTitle =
    switcherGroups.length > 1
      ? MOBILE_WORKSPACE_SWITCHER_MULTI_TITLE
      : (switcherGroups[0]?.title ?? MOBILE_WORKSPACE_SWITCHER_MULTI_TITLE);

  return (
    <nav className="nbos-mobile-dock md:hidden" aria-label="Workspace tools">
      <div className={cn(MOBILE_DOCK_ROW_CLASS, MOBILE_DOCK_HEIGHT_CLASS)}>
        <WorkspaceMenuButton open={menuOpen} onClick={onMoreClick} />
        {hasSearch && tools.search ? <MobilePageSearchSheet search={tools.search} /> : null}
        <WorkspaceCreateButton create={resolvedCreate} />
        {switcherGroups.length > 0 ? (
          <MobileDockSwitcherButton
            icon={switcherItem?.icon}
            label={switcherItem?.label}
            expanded={switcherOpen}
            onClick={() => setSwitcherOpen(true)}
          />
        ) : null}
        {hasSettings && settings ? <div className="contents">{settings}</div> : null}
      </div>
      {isMobileViewport ? (
        <div ref={trailingHostRef} hidden>
          {tools.trailing}
          {tools.tabsEnd}
        </div>
      ) : null}
      <MobileDockOverflowSheet
        open={switcherOpen}
        onOpenChange={setSwitcherOpen}
        groups={switcherGroups}
        title={switcherTitle}
      />
    </nav>
  );
}

function WorkspaceMenuButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <MobileDockItem label="Menu" active={open} aria-expanded={open} onClick={onClick}>
      <LayoutGrid size={MOBILE_DOCK_ICON_SIZE_PX} aria-hidden />
    </MobileDockItem>
  );
}

function WorkspaceCreateButton({ create }: { create?: MobileDockCreateAction }) {
  if (!create) return null;
  return (
    <MobileDockItem
      label={MOBILE_WORKSPACE_CREATE_LABEL}
      disabled={create.disabled}
      onClick={() => {
        if (!create.disabled) create.onSelect();
      }}
    >
      <Plus size={MOBILE_DOCK_ICON_SIZE_PX} aria-hidden />
    </MobileDockItem>
  );
}
