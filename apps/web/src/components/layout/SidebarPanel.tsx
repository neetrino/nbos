'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import type { SidebarModuleKey } from '@nbos/shared/constants';
import { cn } from '@/lib/utils';
import type { DashboardPersonalLink } from '@/lib/api/dashboard';
import { applySidebarPreferences } from '@/lib/navigation/apply-sidebar-preferences';
import { SidebarNavList } from './SidebarNavList';
import { SidebarNavigationCustomizeSheet } from './SidebarNavigationCustomizeSheet';
import { SidebarSettingsMenu } from './SidebarSettingsMenu';
import {
  SIDEBAR_HEADER_CLASS,
  SIDEBAR_HEADER_HEIGHT_CLASS,
  SIDEBAR_LOGO_MAX_WIDTH_CLASS,
  SIDEBAR_NAV_LIST_CLASS,
} from './sidebar-layout-constants';

export type SidebarPanelProps = {
  visuallyExpanded: boolean;
  collapsedForHeader: boolean;
  showHeaderToggle: boolean;
  headerToggleLabel: string;
  onHeaderToggle: () => void;
  layout: ReturnType<typeof applySidebarPreferences>;
  personalLinks: DashboardPersonalLink[];
  moreExpanded: boolean;
  onToggleMore: () => void;
  customizeOpen: boolean;
  onCustomizeOpenChange: (open: boolean) => void;
  isSaving: boolean;
  onReorder: (keys: SidebarModuleKey[]) => void;
  onHide: (key: SidebarModuleKey) => void;
  onRestore: (key: SidebarModuleKey) => void;
  onCreateLink: (label: string, url: string) => Promise<void>;
  onDeleteLink: (id: string) => Promise<void>;
  onOpenCustomize: () => void;
};

export function SidebarPanel({
  visuallyExpanded,
  collapsedForHeader,
  showHeaderToggle,
  headerToggleLabel,
  onHeaderToggle,
  layout,
  personalLinks,
  moreExpanded,
  onToggleMore,
  customizeOpen,
  onCustomizeOpenChange,
  isSaving,
  onReorder,
  onHide,
  onRestore,
  onCreateLink,
  onDeleteLink,
  onOpenCustomize,
}: SidebarPanelProps) {
  return (
    <>
      <SidebarHeader
        collapsed={collapsedForHeader}
        showToggle={showHeaderToggle}
        toggleLabel={headerToggleLabel}
        onToggle={onHeaderToggle}
      />

      <nav className={cn('flex-1 overflow-y-auto', SIDEBAR_NAV_LIST_CLASS)}>
        <SidebarNavList
          collapsed={!visuallyExpanded}
          primaryItems={layout.primary}
          hiddenItems={layout.hidden}
          personalLinks={personalLinks}
          moreExpanded={moreExpanded}
          onToggleMore={onToggleMore}
        />
      </nav>

      <div className="border-sidebar-border border-t p-1.5">
        <SidebarSettingsMenu collapsed={!visuallyExpanded} onCustomizeMenu={onOpenCustomize} />
      </div>

      <SidebarNavigationCustomizeSheet
        open={customizeOpen}
        onOpenChange={onCustomizeOpenChange}
        primaryItems={layout.primary}
        hiddenItems={layout.hidden}
        personalLinks={personalLinks}
        isSaving={isSaving}
        onReorder={onReorder}
        onHide={onHide}
        onRestore={onRestore}
        onCreateLink={onCreateLink}
        onDeleteLink={onDeleteLink}
      />
    </>
  );
}

function SidebarHeader({
  collapsed,
  showToggle,
  toggleLabel,
  onToggle,
}: {
  collapsed: boolean;
  showToggle: boolean;
  toggleLabel: string;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        SIDEBAR_HEADER_CLASS,
        SIDEBAR_HEADER_HEIGHT_CLASS,
        collapsed && showToggle && 'justify-center',
      )}
    >
      {showToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label={toggleLabel}
          className="text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
      ) : null}
      {!collapsed && (
        <Link href="/dashboard" className="flex min-w-0 flex-1 items-center overflow-hidden px-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- sidebar logo SVG; fixed dimensions, no next/image benefit */}
          <img
            src="/logo/logo.svg"
            alt="NBOS"
            width={120}
            height={20}
            className={cn('h-5 w-auto', SIDEBAR_LOGO_MAX_WIDTH_CLASS)}
          />
        </Link>
      )}
    </div>
  );
}
