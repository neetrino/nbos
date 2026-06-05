'use client';

import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { cn } from '@/lib/utils';
import {
  KANBAN_CARD_SHELL_BASE_SHADOW_CLASS,
  KANBAN_CARD_SHELL_HOVER_SHADOW_CLASS,
  KANBAN_CARD_SHELL_HOVER_SURFACE_CLASS,
  KANBAN_CARD_SHELL_PADDING_CLASS,
  KANBAN_CARD_SHELL_RADIUS_CLASS,
  KANBAN_CARD_SHELL_TRANSITION_CLASS,
  type KanbanCardShellBaseShadow,
  type KanbanCardShellHoverShadow,
  type KanbanCardShellHoverSurface,
  type KanbanCardShellPadding,
  type KanbanCardShellRadius,
  type KanbanCardShellTransition,
} from './kanban-card-shell-classes';

export type KanbanCardShellPreset = 'neutral' | 'crm';

export type KanbanCardShellProps<T extends ElementType = 'div'> = {
  as?: T;
  /** `crm` — border only; tint/bg from {@link shellClassName} (deal/lead type visuals). */
  preset?: KanbanCardShellPreset;
  radius?: KanbanCardShellRadius;
  padding?: KanbanCardShellPadding;
  baseShadow?: KanbanCardShellBaseShadow;
  hoverShadow?: KanbanCardShellHoverShadow | false;
  hoverSurface?: KanbanCardShellHoverSurface;
  transition?: KanbanCardShellTransition;
  shellClassName?: string;
} & ComponentPropsWithoutRef<T>;

/**
 * Shared outer surface for kanban entity cards (border, radius, hover).
 * Domain cards keep their own content and actions inside.
 */
export function KanbanCardShell<T extends ElementType = 'div'>({
  as,
  preset = 'neutral',
  radius = 'xl',
  padding = 'md',
  baseShadow = 'none',
  hoverShadow = 'sm',
  hoverSurface,
  transition = 'shadow',
  shellClassName,
  className,
  ...rest
}: KanbanCardShellProps<T>) {
  const Component = (as ?? 'div') as ElementType;

  return (
    <Component
      className={cn(
        preset === 'neutral' ? 'border-border bg-card border' : 'border',
        KANBAN_CARD_SHELL_RADIUS_CLASS[radius],
        KANBAN_CARD_SHELL_PADDING_CLASS[padding],
        KANBAN_CARD_SHELL_BASE_SHADOW_CLASS[baseShadow],
        hoverShadow !== false && KANBAN_CARD_SHELL_HOVER_SHADOW_CLASS[hoverShadow],
        hoverSurface && KANBAN_CARD_SHELL_HOVER_SURFACE_CLASS[hoverSurface],
        KANBAN_CARD_SHELL_TRANSITION_CLASS[transition],
        shellClassName,
        className,
      )}
      {...rest}
    />
  );
}
