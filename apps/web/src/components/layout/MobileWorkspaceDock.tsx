'use client';

import { useRef, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { cn } from '@/lib/utils';
import { MobileDockOverflowSheet } from './MobileDockOverflowSheet';
import { MobileDockItem } from './MobileDockItem';
import { MobileDockSwitcherButton } from './MobileDockSwitcherButton';
import { MobilePageSearchSheet } from './MobilePageSearchSheet';
import { MobileWorkspaceCreateButton } from './MobileWorkspaceCreateButton';
import { useMobileModuleDockResolved } from './MobileModuleDockProvider';
import { usePageHeroDockCreate } from './use-page-hero-dock-create';
import {
  MOBILE_DOCK_HEIGHT_CLASS,
  MOBILE_DOCK_ICON_SIZE_PX,
  MOBILE_DOCK_ROW_CLASS,
} from './mobile-bottom-nav-constants';
import { resolveMobileDockSwitcherTitle } from './mobile-dock-switcher-title';

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
  const t = useTranslations('navigation');
  const switcherTitle = resolveMobileDockSwitcherTitle(switcherGroups, t);

  return (
    <nav className="nbos-mobile-dock md:hidden" aria-label={t('mobileDock.toolsAria')}>
      <div className={cn(MOBILE_DOCK_ROW_CLASS, MOBILE_DOCK_HEIGHT_CLASS)}>
        <WorkspaceMenuButton open={menuOpen} onClick={onMoreClick} />
        {hasSearch && tools.search ? <MobilePageSearchSheet search={tools.search} /> : null}
        <MobileWorkspaceCreateButton create={resolvedCreate} />
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
  const t = useTranslations('navigation');

  return (
    <MobileDockItem label={t('mobileDock.menu')} active={open} aria-expanded={open} onClick={onClick}>
      <LayoutGrid size={MOBILE_DOCK_ICON_SIZE_PX} aria-hidden />
    </MobileDockItem>
  );
}
