'use client';

import type { MouseEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ActionTileHoverBarVariant = 'card' | 'row' | 'kanban-card';

const HOVER_REVEAL_BY_VARIANT: Record<ActionTileHoverBarVariant, string> = {
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
  'kanban-card': [
    'pointer-events-none opacity-0 transition-opacity duration-150',
    'group-hover/kanban-card:pointer-events-auto group-hover/kanban-card:opacity-100',
    'group-focus-within/kanban-card:pointer-events-auto group-focus-within/kanban-card:opacity-100',
  ].join(' '),
};

function stopCardClick(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

interface ActionTileHoverBarProps {
  variant: ActionTileHoverBarVariant;
  children: ReactNode;
  className?: string;
}

export function ActionTileHoverBar({ variant, children, className }: ActionTileHoverBarProps) {
  return (
    <div
      onPointerDown={stopCardClick}
      onClick={stopCardClick}
      className={cn(
        'flex flex-wrap justify-end gap-2',
        variant === 'row' ? 'shrink-0 items-center' : 'mt-2',
        HOVER_REVEAL_BY_VARIANT[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
