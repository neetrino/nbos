'use client';

import { Folder, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDriveLabel } from './drive-format';
import type { DriveLibraryEntityRow } from './drive-library-entity-loaders';
import { DriveTileShell } from './DriveTileShell';

type DriveLibraryEntityLayout = 'cards' | 'list' | 'tiles';

const ENTITY_TABLE_MAIN_GRID =
  'grid grid-cols-[40px_minmax(220px,1fr)_130px_120px_110px_100px] gap-3';

const ENTITY_CARD_ICON_CLASS =
  'text-foreground/80 dark:text-foreground/70 h-[min(5.25rem,47cqh)] w-[min(5.25rem,47cqw)] shrink-0';

export function DriveLibraryEntityCardRow({
  row,
  layout,
  onOpenRow,
}: {
  row: DriveLibraryEntityRow;
  layout: DriveLibraryEntityLayout;
  onOpenRow: (row: DriveLibraryEntityRow) => void;
}) {
  const typeLabel = formatDriveLabel(row.entityType);

  if (layout === 'tiles') {
    return (
      <DriveTileShell
        title={row.label}
        subtitle={typeLabel}
        subtitleTrailing={row.code}
        icon={<FolderKanban className="size-5" aria-hidden />}
        onClick={() => onOpenRow(row)}
      />
    );
  }

  if (layout === 'list') {
    return (
      <div className="border-border/60 bg-card/90 hover:border-primary/25 hover:bg-card flex w-full items-center gap-2 rounded-xl border p-2.5 shadow-sm transition-colors">
        <button
          type="button"
          onClick={() => onOpenRow(row)}
          className="focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2"
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
  const typeLabel = formatDriveLabel(row.entityType);

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        ENTITY_TABLE_MAIN_GRID,
        'hover:bg-muted/50 focus-visible:ring-ring w-full cursor-pointer px-4 py-3 text-left text-sm outline-none focus-visible:ring-2',
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
      <span className="text-muted-foreground text-xs">Folder</span>
      <span className="text-muted-foreground text-xs">{typeLabel}</span>
      <span className="text-muted-foreground text-xs">—</span>
      <span />
    </div>
  );
}
