import type { KanbanTerminalDropTone, KanbanTerminalDropZone } from './kanban.types';
import { cn } from '@/lib/utils';

const TERMINAL_DROP_TONE_ORDER: Record<KanbanTerminalDropTone, number> = {
  danger: 0,
  neutral: 1,
  success: 2,
};

/** Red (danger) left, green (success) right — same layout on every kanban board. */
export function sortTerminalDropZonesForDisplay(
  zones: readonly KanbanTerminalDropZone[],
): KanbanTerminalDropZone[] {
  return [...zones].sort(
    (a, b) => TERMINAL_DROP_TONE_ORDER[a.tone] - TERMINAL_DROP_TONE_ORDER[b.tone],
  );
}

export type TerminalDropStripEdge = 'left' | 'right' | 'single';

export function getTerminalDropStripEdge(index: number, zoneCount: number): TerminalDropStripEdge {
  if (zoneCount <= 1) return 'single';
  if (index === 0) return 'left';
  return 'right';
}

/** Full-height hit target while dragging (matches board `pb-28`). */
export const KANBAN_TERMINAL_DROP_BAR_HIT_HEIGHT_CLASS = 'h-24';

/** Idle visual strip height. */
export const KANBAN_TERMINAL_DROP_STRIP_BASE_HEIGHT_CLASS = 'min-h-14';

/** Target zone under drag — taller so the choice is obvious. */
export const KANBAN_TERMINAL_DROP_STRIP_ACTIVE_HEIGHT_CLASS = 'min-h-24';

/** Default split: danger 30%, success 70% (canon terminal bar). */
export function terminalDropZoneIdleWidthClass(tone: KanbanTerminalDropTone): string {
  if (tone === 'success') return 'flex-[7] basis-0';
  if (tone === 'danger') return 'flex-[3] basis-0';
  return 'flex-1 basis-0';
}

export function terminalDropZoneWidthClass(
  tone: KanbanTerminalDropTone,
  highlighted: boolean,
  siblingHighlighted: boolean,
): string {
  if (highlighted) return 'flex-[7] basis-0';
  if (siblingHighlighted) return 'flex-[3] basis-0';
  return terminalDropZoneIdleWidthClass(tone);
}

export function terminalDropZoneHitAreaClass(
  tone: KanbanTerminalDropTone,
  highlighted: boolean,
  siblingHighlighted: boolean,
): string {
  return cn(
    'flex min-h-0 flex-col justify-end self-stretch',
    'transition-[flex-grow,flex-basis,min-height] duration-200 ease-out',
    KANBAN_TERMINAL_DROP_BAR_HIT_HEIGHT_CLASS,
    terminalDropZoneWidthClass(tone, highlighted, siblingHighlighted),
  );
}

export function terminalDropStripVisualClass(
  tone: KanbanTerminalDropTone,
  highlighted: boolean,
  edge: TerminalDropStripEdge,
): string {
  const toneClass =
    tone === 'success'
      ? 'bg-emerald-500 text-white'
      : tone === 'danger'
        ? 'bg-red-500 text-white'
        : 'bg-stone-500 text-white';

  const radiusClass =
    edge === 'single'
      ? 'rounded-t-xl'
      : edge === 'left'
        ? 'rounded-tl-xl rounded-tr-lg'
        : 'rounded-tr-xl rounded-tl-lg';

  return cn(
    'flex w-full items-center justify-center text-sm font-semibold tracking-tight',
    'transition-[min-height,filter,opacity,box-shadow,border-radius,width] duration-200 ease-out',
    radiusClass,
    highlighted
      ? KANBAN_TERMINAL_DROP_STRIP_ACTIVE_HEIGHT_CLASS
      : KANBAN_TERMINAL_DROP_STRIP_BASE_HEIGHT_CLASS,
    toneClass,
    highlighted
      ? 'brightness-110 saturate-110 shadow-[0_-4px_12px_rgba(0,0,0,0.15)]'
      : 'opacity-90',
  );
}

export const KANBAN_TERMINAL_DROP_BAR_SHELL_CLASS = cn(
  'pointer-events-auto fixed inset-x-0 bottom-0 z-40 flex w-full items-end',
  KANBAN_TERMINAL_DROP_BAR_HIT_HEIGHT_CLASS,
);
