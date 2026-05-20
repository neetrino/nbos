import type { KanbanTerminalDropTone } from './kanban.types';
import { cn } from '@/lib/utils';

/** Full-width bottom strip height while dragging (matches board `pb-28`). */
export const KANBAN_TERMINAL_DROP_STRIP_HEIGHT_CLASS = 'min-h-14';

export function terminalDropStripClass(tone: KanbanTerminalDropTone, highlighted: boolean): string {
  const toneClass =
    tone === 'success'
      ? 'bg-emerald-500 text-white'
      : tone === 'danger'
        ? 'bg-red-500 text-white'
        : 'bg-stone-500 text-white';

  const widthClass =
    tone === 'success'
      ? 'flex-[7] basis-0'
      : tone === 'danger'
        ? 'flex-[3] basis-0'
        : 'flex-1 basis-0';

  return cn(
    'flex items-center justify-center text-sm font-semibold tracking-tight transition-[filter,opacity] duration-150',
    KANBAN_TERMINAL_DROP_STRIP_HEIGHT_CLASS,
    widthClass,
    toneClass,
    highlighted ? 'brightness-110 saturate-110' : 'opacity-90',
  );
}

export const KANBAN_TERMINAL_DROP_BAR_SHELL_CLASS =
  'pointer-events-auto fixed inset-x-0 bottom-0 z-40 flex w-full';
