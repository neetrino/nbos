'use client';

import type { MouseEvent } from 'react';
import { Plus } from 'lucide-react';

export const SIDEBAR_CREATE_TASK_ARIA_LABEL = 'Create task';

/** Sidebar-scale plus glyph — larger than the 14px chevron, still compact. */
export const SIDEBAR_NAV_QUICK_ACTION_ICON_SIZE_PX = 16;

/**
 * Transparent 32px hit target (`size-8`) with `mr-1` inset from the row edge.
 * Padding is larger than the glyph so the plus stays a mark, not a tile.
 */
export const SIDEBAR_NAV_QUICK_ACTION_BUTTON_CLASS =
  'text-sidebar-muted hover:text-sidebar-foreground pointer-events-none mr-1 flex size-8 shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100';

export function stopSidebarNavQuickActionClick(
  event: Pick<MouseEvent, 'preventDefault' | 'stopPropagation'>,
  onAction: () => void,
): void {
  event.preventDefault();
  event.stopPropagation();
  onAction();
}

interface SidebarNavQuickActionButtonProps {
  onAction: () => void;
}

export function SidebarNavQuickActionButton({ onAction }: SidebarNavQuickActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={SIDEBAR_CREATE_TASK_ARIA_LABEL}
      title={SIDEBAR_CREATE_TASK_ARIA_LABEL}
      className={SIDEBAR_NAV_QUICK_ACTION_BUTTON_CLASS}
      onClick={(event) => stopSidebarNavQuickActionClick(event, onAction)}
    >
      <Plus size={SIDEBAR_NAV_QUICK_ACTION_ICON_SIZE_PX} aria-hidden />
    </button>
  );
}
