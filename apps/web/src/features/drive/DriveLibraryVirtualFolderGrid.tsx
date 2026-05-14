'use client';

import { FolderKanban, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDriveLabel } from './drive-format';
import type { DriveLibraryEntityRow } from './drive-library-entity-loaders';

export function DriveLibraryVirtualFolderGrid({
  libraryTitle,
  rows,
  loading,
  searchQuery,
  onOpenRow,
}: {
  libraryTitle: string;
  rows: DriveLibraryEntityRow[];
  loading: boolean;
  searchQuery: string;
  onOpenRow: (row: DriveLibraryEntityRow) => void;
}) {
  const q = searchQuery.trim().toLowerCase();
  const visible = q
    ? rows.filter(
        (row) => row.label.toLowerCase().includes(q) || row.entityType.toLowerCase().includes(q),
      )
    : rows;

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
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((row) => (
          <li key={`${row.entityType}:${row.id}`}>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'border-border/80 bg-muted/30 hover:bg-muted/50 h-auto w-full justify-start gap-3 rounded-2xl px-3 py-3 text-left',
              )}
              onClick={() => onOpenRow(row)}
            >
              <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                <FolderKanban className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-foreground line-clamp-2 text-sm leading-snug font-medium">
                  {row.label}
                </span>
                <span className="text-muted-foreground mt-0.5 block truncate text-[11px] tracking-wide uppercase">
                  {formatDriveLabel(row.entityType)}
                </span>
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
