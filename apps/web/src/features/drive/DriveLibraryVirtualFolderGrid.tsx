'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DriveViewMode } from './drive-options';
import { driveFolderRowLayout, driveItemsContainerClass } from './drive-view-layout';
import {
  DriveLibraryEntityCardRow,
  DriveLibraryEntityTableRow,
} from './DriveLibraryEntityFolderRows';
import type { DriveLibraryEntityRow } from './drive-library-entity-loaders';

function rowMatchesSearch(row: DriveLibraryEntityRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    row.label.toLowerCase().includes(q) ||
    row.entityType.toLowerCase().includes(q) ||
    (row.code?.toLowerCase().includes(q) ?? false)
  );
}

export function DriveLibraryVirtualFolderGrid({
  libraryTitle,
  rows,
  loading,
  searchQuery,
  viewMode,
  onOpenRow,
}: {
  libraryTitle: string;
  rows: DriveLibraryEntityRow[];
  loading: boolean;
  searchQuery: string;
  viewMode: DriveViewMode;
  onOpenRow: (row: DriveLibraryEntityRow) => void;
}) {
  const visible = rows.filter((row) => rowMatchesSearch(row, searchQuery));

  if (loading) {
    return (
      <div className="border-border/70 bg-card/80 flex min-h-[200px] items-center justify-center rounded-2xl border">
        <Loader2 className="text-muted-foreground size-8 animate-spin" aria-hidden />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="border-border/70 bg-card/80 rounded-2xl border px-4 py-10 text-center">
        <p className="text-muted-foreground text-sm">No records in this library yet.</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Create deals, projects, or other records first.
        </p>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="border-border/70 bg-card/80 rounded-2xl border px-4 py-10 text-center">
        <p className="text-muted-foreground text-sm">No records match your search.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex flex-wrap items-end justify-between gap-2 text-xs">
        <p>
          <span className="text-foreground font-medium">{libraryTitle}</span>
          <span className="mx-1.5">·</span>
          Open a record to see linked files and upload.
        </p>
      </div>
      {viewMode === 'table' ? (
        <LibraryEntityTable rows={visible} onOpenRow={onOpenRow} />
      ) : (
        <div className={cn(driveItemsContainerClass(viewMode))}>
          {visible.map((row) => (
            <DriveLibraryEntityCardRow
              key={`${row.entityType}:${row.id}`}
              row={row}
              layout={driveFolderRowLayout(viewMode)}
              onOpenRow={onOpenRow}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryEntityTable({
  rows,
  onOpenRow,
}: {
  rows: DriveLibraryEntityRow[];
  onOpenRow: (row: DriveLibraryEntityRow) => void;
}) {
  return (
    <div className="border-border/70 bg-card/80 overflow-hidden rounded-3xl border">
      <div className="text-muted-foreground border-border/60 grid grid-cols-[40px_minmax(220px,1fr)_130px_120px_110px_100px] gap-3 border-b px-4 py-3 text-xs font-medium">
        <span />
        <span>Name</span>
        <span>Kind</span>
        <span>Type</span>
        <span>Updated</span>
        <span />
      </div>
      <div className="divide-border/60 divide-y">
        {rows.map((row) => (
          <DriveLibraryEntityTableRow
            key={`${row.entityType}:${row.id}`}
            row={row}
            onOpenRow={onOpenRow}
          />
        ))}
      </div>
    </div>
  );
}
