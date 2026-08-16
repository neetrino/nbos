'use client';

import type { MouseEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ActionTileHoverBarVariant =
  | 'card'
  | 'row'
  | 'kanban-card'
  | 'project-hub-card'
  | 'project-hub-card-footer'
  | 'card-footer';

const HOVER_REVEAL_BY_VARIANT: Record<Exclude<ActionTileHoverBarVariant, 'kanban-card'>, string> = {
  card: [
    'pointer-events-none opacity-0 transition-opacity duration-150',
    'group-hover/entity-card:pointer-events-auto group-hover/entity-card:opacity-100',
    'group-focus-within/entity-card:pointer-events-auto group-focus-within/entity-card:opacity-100',
  ].join(' '),
  row: [
    'pointer-events-none opacity-0 transition-opacity duration-150',
    'group-hover/entity-row:pointer-events-auto group-hover/entity-row:opacity-100',
    'group-focus-within/entity-row:pointer-events-auto group-focus-within/entity-row:opacity-100',
  ].join(' '),
  'project-hub-card': [
    'pointer-events-none opacity-0 transition-opacity duration-150',
    'group-hover/project-hub-card:pointer-events-auto group-hover/project-hub-card:opacity-100',
    'group-focus-within/project-hub-card:pointer-events-auto group-focus-within/project-hub-card:opacity-100',
  ].join(' '),
  /** Parent toggles visibility — bar stays interactive when shown. */
  'project-hub-card-footer': '',
  /** Always-visible equal-width footer tiles on product cards. */
  'card-footer': 'grid w-full grid-cols-3 gap-2',
};

const KANBAN_CARD_OVERLAY_BASE_CLASS =
  'absolute inset-x-2 bottom-2 z-10 transition-opacity duration-150';

function stopCardClick(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

interface ActionTileHoverBarProps {
  variant: ActionTileHoverBarVariant;
  children: ReactNode;
  className?: string;
  /**
   * Controlled reveal for `kanban-card` (avoids sticky CSS :hover / :focus-within
   * after opening a sheet or navigating away).
   */
  revealed?: boolean;
}

export function ActionTileHoverBar({
  variant,
  children,
  className,
  revealed = false,
}: ActionTileHoverBarProps) {
  const isFooterGrid = variant === 'card-footer';
  const isKanbanOverlay = variant === 'kanban-card';

  return (
    <div
      onPointerDown={stopCardClick}
      onClick={stopCardClick}
      className={cn(
        isFooterGrid ? null : 'flex flex-wrap justify-end gap-2',
        variant === 'row'
          ? 'shrink-0 items-center'
          : variant === 'project-hub-card' ||
              variant === 'project-hub-card-footer' ||
              isKanbanOverlay ||
              isFooterGrid
            ? ''
            : 'mt-2',
        isKanbanOverlay
          ? cn(
              KANBAN_CARD_OVERLAY_BASE_CLASS,
              revealed ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
            )
          : HOVER_REVEAL_BY_VARIANT[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
