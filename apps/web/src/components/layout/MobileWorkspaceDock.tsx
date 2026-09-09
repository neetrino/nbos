'use client';

import { useState } from 'react';
import { LayoutGrid, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileModuleDockResolved } from './MobileModuleDockProvider';
import { MobileDockOverflowSheet } from './MobileDockOverflowSheet';
import { MobilePageSearchSheet } from './MobilePageSearchSheet';
import { pickActiveMobileDockItem } from './mobile-module-dock-resolve';
import { MOBILE_DOCK_HEIGHT_CLASS, MOBILE_DOCK_ITEM_CLASS } from './mobile-bottom-nav-constants';
import {
  MOBILE_WORKSPACE_CATEGORY_SHEET_TITLE,
  MOBILE_WORKSPACE_CREATE_LABEL,
  MOBILE_WORKSPACE_DEFAULT_SCOPE_LABEL,
  MOBILE_WORKSPACE_SEARCH_LABEL,
} from './mobile-workspace-dock-constants';

interface MobileWorkspaceDockProps {
  menuOpen?: boolean;
  onMoreClick: () => void;
}

export function MobileWorkspaceDock({ menuOpen = false, onMoreClick }: MobileWorkspaceDockProps) {
  const { scopeItems, hasSearch, hasCreate, hasSettings, workspaceActions, getTools } =
    useMobileModuleDockResolved();
  const tools = getTools();
  const create = workspaceActions.create ?? tools.create;
  const settings = workspaceActions.settings ?? tools.settings;
  const [categoryOpen, setCategoryOpen] = useState(false);
  const activeScope = pickActiveMobileDockItem(scopeItems);
  const ScopeIcon = activeScope?.icon;

  return (
    <nav className="nbos-mobile-dock md:hidden" aria-label="Workspace tools">
      <div className={cn('flex items-stretch gap-1 px-1.5', MOBILE_DOCK_HEIGHT_CLASS)}>
        <button
          type="button"
          onClick={onMoreClick}
          className={cn(
            MOBILE_DOCK_ITEM_CLASS,
            menuOpen
              ? 'bg-primary/12 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
          )}
          aria-expanded={menuOpen}
        >
          <LayoutGrid size={18} aria-hidden />
          Menu
        </button>
        {hasSearch && tools.search ? (
          <MobilePageSearchSheet
            search={tools.search}
            variant="dock"
            label={MOBILE_WORKSPACE_SEARCH_LABEL}
          />
        ) : null}
        {hasCreate && create ? (
          <button
            type="button"
            disabled={create.disabled}
            className={cn(
              MOBILE_DOCK_ITEM_CLASS,
              create.disabled
                ? 'text-muted-foreground/50'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
            )}
            onClick={() => {
              if (!create.disabled) create.onSelect();
            }}
          >
            <Plus size={18} aria-hidden />
            {MOBILE_WORKSPACE_CREATE_LABEL}
          </button>
        ) : null}
        {scopeItems.length > 0 ? (
          <button
            type="button"
            onClick={() => setCategoryOpen(true)}
            className={cn(
              MOBILE_DOCK_ITEM_CLASS,
              categoryOpen
                ? 'bg-primary/12 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
            )}
            aria-expanded={categoryOpen}
          >
            {ScopeIcon ? <ScopeIcon size={18} aria-hidden /> : null}
            <span className="max-w-full truncate">
              {activeScope?.label ?? MOBILE_WORKSPACE_DEFAULT_SCOPE_LABEL}
            </span>
          </button>
        ) : null}
        {hasSettings && settings ? (
          <div className="flex min-w-0 flex-1 items-stretch">{settings}</div>
        ) : null}
      </div>
      <MobileDockOverflowSheet
        open={categoryOpen}
        onOpenChange={setCategoryOpen}
        items={scopeItems}
        title={MOBILE_WORKSPACE_CATEGORY_SHEET_TITLE}
      />
    </nav>
  );
}
