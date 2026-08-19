'use client';

import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

const PREVIEW_ACTION_CLASS =
  'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 inline-flex items-center gap-1 text-sm font-medium transition-colors';

interface EntityNotesPreviewFooterProps {
  expanded: boolean;
  canCollapse: boolean;
  disabled?: boolean;
  onEdit: () => void;
  onToggleExpand: () => void;
}

/** Bitrix-style Edit + See more / Collapse row under a collapsible description. */
export function EntityNotesPreviewFooter({
  expanded,
  canCollapse,
  disabled = false,
  onEdit,
  onToggleExpand,
}: EntityNotesPreviewFooterProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <button
        type="button"
        disabled={disabled}
        className={cn(PREVIEW_ACTION_CLASS, disabled && 'pointer-events-none opacity-50')}
        onPointerDown={(event) => event.preventDefault()}
        onClick={onEdit}
      >
        <Pencil className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
        Edit
      </button>
      {canCollapse ? (
        <button
          type="button"
          disabled={disabled}
          className={cn(PREVIEW_ACTION_CLASS, disabled && 'pointer-events-none opacity-50')}
          onClick={onToggleExpand}
        >
          {expanded ? 'Collapse' : 'See more'}
        </button>
      ) : null}
    </div>
  );
}
