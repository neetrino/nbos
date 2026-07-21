'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import type { SidebarModuleKey } from '@nbos/shared/constants';
import { cn } from '@/lib/utils';
import { usePermission } from '@/lib/permissions';
import { NAV_MODULE_DEFINITIONS } from '@/lib/navigation/nav-config';
import { applySidebarPreferences } from '@/lib/navigation/apply-sidebar-preferences';
import { getVisibleNavModules } from '@/lib/navigation/nav-visibility';
import { useSidebarNavigation } from '@/lib/navigation/use-sidebar-navigation';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { SidebarNavList } from './SidebarNavList';
import { SidebarNavigationCustomizeSheet } from './SidebarNavigationCustomizeSheet';
import { SidebarSettingsMenu } from './SidebarSettingsMenu';
import {
  SIDEBAR_HEADER_CLASS,
  SIDEBAR_HEADER_HEIGHT_CLASS,
  SIDEBAR_LOGO_MAX_WIDTH_CLASS,
  SIDEBAR_MOBILE_SHEET_CLASS,
  SIDEBAR_NAV_LIST_CLASS,
  SIDEBAR_WIDTH_COLLAPSED_PX,
  SIDEBAR_WIDTH_EXPANDED_PX,
} from './sidebar-layout-constants';

type SidebarProps = {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  /** When set, sidebar is a mobile drawer (open controlled by parent). */
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
};

export function Sidebar({
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileOpenChange,
}: SidebarProps) {
  const isMobileDrawer = mobileOpen !== undefined && onMobileOpenChange !== undefined;
  const { can, isLoading: permsLoading } = usePermission();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [moreExpanded, setMoreExpanded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const navigation = useSidebarNavigation();
  const pathname = usePathname();
  // Hover-expand overlay is only meaningful on /documents where the sidebar
  // is auto-collapsed to give the editor more space.  On all other routes
  // the sidebar is expanded by default; hover should have no special effect.
  const isDocumentsRoute = pathname.startsWith('/documents');

  // Reset hover state on every route change so stale hover cannot persist
  // across navigation (e.g. clicking a nav item while hover-expanded).
  useEffect(() => {
    startTransition(() => setIsHovering(false));
  }, [pathname]);

  const visibleModules = useMemo(
    () => getVisibleNavModules(can, permsLoading, NAV_MODULE_DEFINITIONS),
    [can, permsLoading],
  );

  const layout = useMemo(
    () =>
      applySidebarPreferences(
        visibleModules,
        navigation.sidebarModuleOrder,
        navigation.hiddenSidebarModules,
      ),
    [visibleModules, navigation.sidebarModuleOrder, navigation.hiddenSidebarModules],
  );

  const visibleKeys = useMemo(
    () => [...layout.primary, ...layout.hidden].map((item) => item.key),
    [layout.primary, layout.hidden],
  );

  const handleReorder = (primaryKeys: SidebarModuleKey[]) => {
    navigation.reorderPrimaryModules(visibleKeys, primaryKeys);
  };

  // Hover overlay is active only on /documents and only when sidebar is collapsed.
  const isHoveringCollapsed = !isMobileDrawer && collapsed && isHovering && isDocumentsRoute;
  // Visual expansion follows click state everywhere; hover adds to it only on /documents.
  const visuallyExpanded = isMobileDrawer || !collapsed || isHoveringCollapsed;

  const panel = (
    <SidebarPanel
      visuallyExpanded={visuallyExpanded}
      collapsedForHeader={!visuallyExpanded}
      headerToggleLabel={
        isMobileDrawer ? 'Close navigation' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'
      }
      onHeaderToggle={() => {
        if (isMobileDrawer) {
          onMobileOpenChange(false);
          return;
        }
        setIsHovering(false);
        onCollapsedChange(!collapsed);
      }}
      layout={layout}
      personalLinks={navigation.sidebarLinks}
      moreExpanded={moreExpanded}
      onToggleMore={() => setMoreExpanded((value) => !value)}
      customizeOpen={customizeOpen}
      onCustomizeOpenChange={setCustomizeOpen}
      isSaving={navigation.isSaving}
      onReorder={handleReorder}
      onHide={navigation.hideModule}
      onRestore={navigation.restoreModule}
      onCreateLink={navigation.createPersonalLink}
      onDeleteLink={navigation.deletePersonalLink}
      onOpenCustomize={() => setCustomizeOpen(true)}
    />
  );

  if (isMobileDrawer) {
    return (
      <>
        {/* Zero-width grid placeholder — drawer is portaled via Sheet. */}
        <div className="w-0 shrink-0 overflow-hidden" aria-hidden />
        <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
          <SheetContent side="left" showCloseButton={false} className={SIDEBAR_MOBILE_SHEET_CLASS}>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">
              Primary app modules and personal links
            </SheetDescription>
            <div className="border-sidebar-border bg-sidebar flex h-full flex-col overflow-x-hidden">
              {panel}
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    /*
     * Outer aside — the real layout column that AppLayout's CSS grid measures.
     * Its width is ONLY driven by the click-expand state (collapsed prop).
     * Hover NEVER changes this width, so the grid never shifts during hover.
     * position:relative makes it the containing block for the inner surface.
     */
    <aside
      className="relative h-screen min-w-0 shrink-0"
      style={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED_PX : SIDEBAR_WIDTH_EXPANDED_PX }}
    >
      {/*
       * Inner visual surface.
       *
       * Collapsed + hovered → absolute positioning lets the surface visually
       * expand to the full expanded width while the outer aside (and the
       * AppLayout grid column) remains at the collapsed width.  The surface
       * overlays the first slice of main content while hovered; as soon as
       * the mouse leaves, it collapses back. z-40 keeps it above page content
       * but below modals/dialogs (typically z-50+).
       *
       * Expanded (click state) → h-full, in normal flow, no overlay trick.
       *
       * Mouse events live here (not on the outer aside) so onMouseLeave fires
       * at the visual 260 px edge, not the layout 56 px edge.
       */}
      <div
        className={cn(
          'border-sidebar-border bg-sidebar flex flex-col overflow-x-hidden border-r',
          'transition-[width] duration-200',
          isHoveringCollapsed ? 'absolute inset-y-0 left-0 z-[45] shadow-xl' : 'h-full',
        )}
        style={{
          width: visuallyExpanded ? SIDEBAR_WIDTH_EXPANDED_PX : SIDEBAR_WIDTH_COLLAPSED_PX,
        }}
        onMouseEnter={() => collapsed && isDocumentsRoute && setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {panel}
      </div>
    </aside>
  );
}

type SidebarPanelProps = {
  visuallyExpanded: boolean;
  collapsedForHeader: boolean;
  headerToggleLabel: string;
  onHeaderToggle: () => void;
  layout: ReturnType<typeof applySidebarPreferences>;
  personalLinks: ReturnType<typeof useSidebarNavigation>['sidebarLinks'];
  moreExpanded: boolean;
  onToggleMore: () => void;
  customizeOpen: boolean;
  onCustomizeOpenChange: (open: boolean) => void;
  isSaving: boolean;
  onReorder: (keys: SidebarModuleKey[]) => void;
  onHide: (key: SidebarModuleKey) => void;
  onRestore: (key: SidebarModuleKey) => void;
  onCreateLink: ReturnType<typeof useSidebarNavigation>['createPersonalLink'];
  onDeleteLink: ReturnType<typeof useSidebarNavigation>['deletePersonalLink'];
  onOpenCustomize: () => void;
};

function SidebarPanel({
  visuallyExpanded,
  collapsedForHeader,
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
  toggleLabel,
  onToggle,
}: {
  collapsed: boolean;
  toggleLabel: string;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        SIDEBAR_HEADER_CLASS,
        SIDEBAR_HEADER_HEIGHT_CLASS,
        collapsed && 'justify-center',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={toggleLabel}
        className="text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
      >
        <Menu size={20} />
      </button>
      {!collapsed && (
        <Link href="/dashboard" className="flex min-w-0 flex-1 items-center overflow-hidden">
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
