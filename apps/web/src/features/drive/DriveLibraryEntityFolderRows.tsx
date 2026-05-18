'use client';

import { Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDriveLabel } from './drive-format';
import type { DriveLibraryEntityRow } from './drive-library-entity-loaders';

const ENTITY_TABLE_GRID = 'grid w-full grid-cols-[40px_minmax(220px,1fr)_130px_120px] gap-3';

const ENTITY_CARD_ICON_CLASS =
  'text-foreground/80 dark:text-foreground/70 h-[min(5.25rem,47cqh)] w-[min(5.25rem,47cqw)] shrink-0';

export function DriveLibraryEntityCardRow({
  row,
  compact,
  onOpenRow,
}: {
  row: DriveLibraryEntityRow;
  compact: boolean;
  onOpenRow: (row: DriveLibraryEntityRow) => void;
}) {
  const typeLabel = formatDriveLabel(row.entityType);

  if (compact) {
    return (
      <div className="border-border/60 bg-card/90 hover:border-primary/25 hover:bg-card relative flex w-full items-center gap-2 rounded-xl border p-2.5 shadow-sm transition-colors">
        {row.code ? (
          <span className="text-muted-foreground absolute top-2 right-2 max-w-[45%] truncate font-mono text-[10px] leading-none">
            {row.code}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => onOpenRow(row)}
          className="focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 rounded-xl pr-14 text-left outline-none focus-visible:ring-2"
        >
          <Folder className="text-muted-foreground size-5 shrink-0" strokeWidth={2} />
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-medium">{row.label}</p>
            <p className="text-muted-foreground text-[11px] leading-tight tracking-wide uppercase">
              {typeLabel}
            </p>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="border-border/60 bg-card/90 hover:border-primary/25 group hover:bg-card relative flex aspect-square w-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-colors">
      {row.code ? (
        <span className="text-muted-foreground absolute top-2 right-2 z-10 max-w-[calc(100%-1rem)] truncate font-mono text-[10px] leading-none">
          {row.code}
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => onOpenRow(row)}
        className="focus-visible:ring-ring flex min-h-0 flex-1 flex-col px-3 pt-10 pb-3 text-center outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Folder className={ENTITY_CARD_ICON_CLASS} strokeWidth={1.35} aria-hidden />
        </div>
        <div className="min-h-0 shrink-0 space-y-0.5 pt-1">
          <p className="text-foreground line-clamp-2 text-sm font-semibold">{row.label}</p>
          <p className="text-muted-foreground text-[11px] leading-tight tracking-wide uppercase">
            {typeLabel}
          </p>
        </div>
      </button>
    </div>
  );
}

export function DriveLibraryEntityTableRow({
  row,
  onOpenRow,
}: {
  row: DriveLibraryEntityRow;
  onOpenRow: (row: DriveLibraryEntityRow) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        ENTITY_TABLE_GRID,
        'hover:bg-muted/50 focus-visible:ring-ring cursor-pointer px-4 py-3 text-left text-sm outline-none focus-visible:ring-2',
      )}
      onClick={() => onOpenRow(row)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenRow(row);
        }
      }}
    >
      <Folder className="size-4 self-center text-amber-600 dark:text-amber-400" />
      <span className="truncate font-medium">{row.label}</span>
      <span className="text-muted-foreground text-xs">{formatDriveLabel(row.entityType)}</span>
      <span className="text-muted-foreground truncate font-mono text-xs">{row.code ?? '—'}</span>
    </div>
  );
}
