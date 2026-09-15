'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export const RELATION_PICKER_CREATE_BAR_CLASS =
  'flex w-full shrink-0 items-center gap-2 border-sky-100 bg-sky-50/90 px-3 py-2.5 text-left text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100/90 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-950/60';

export function RelationPickerCreateBar({
  label,
  query,
  multiple,
  position,
  onCreateClick,
}: {
  label: string;
  query: string;
  multiple: boolean;
  position: 'top' | 'bottom';
  onCreateClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCreateClick}
      className={cn(RELATION_PICKER_CREATE_BAR_CLASS, position === 'top' ? 'border-b' : 'border-t')}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white">
        <Plus size={14} />
      </span>
      {label}
      {query.trim() && !multiple ? (
        <span className="truncate font-normal text-sky-600/80 dark:text-sky-400/80">
          — “{query.trim()}”
        </span>
      ) : null}
    </button>
  );
}
