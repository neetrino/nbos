'use client';

import type { DragEvent } from 'react';
import { cn } from '@/lib/utils';
import type { KanbanTerminalDropZone } from './kanban.types';

interface KanbanTerminalDropBarProps {
  zones: KanbanTerminalDropZone[];
  activeZoneKey: string | null;
  onDragOver: (zoneKey: string) => void;
  onDragLeave: () => void;
  onDrop: (zoneKey: string) => void;
}

function zoneToneClass(tone: KanbanTerminalDropZone['tone']): string {
  if (tone === 'danger') {
    return 'border-red-300/80 bg-red-50/90 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200';
  }
  if (tone === 'success') {
    return 'border-emerald-300/80 bg-emerald-50/90 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200';
  }
  return 'border-stone-300/80 bg-stone-50/90 text-stone-700 dark:border-stone-600 dark:bg-stone-900/50 dark:text-stone-200';
}

export function KanbanTerminalDropBar({
  zones,
  activeZoneKey,
  onDragOver,
  onDragLeave,
  onDrop,
}: KanbanTerminalDropBarProps) {
  return (
    <div className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 pointer-events-auto fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] backdrop-blur-md">
      <p className="text-muted-foreground mb-2 text-center text-[11px] font-medium tracking-wide uppercase">
        Drop to close
      </p>
      <div className="mx-auto flex max-w-4xl gap-3">
        {zones.map((zone) => (
          <ZoneDrop
            key={zone.key}
            zone={zone}
            isActive={activeZoneKey === zone.key}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          />
        ))}
      </div>
    </div>
  );
}

function ZoneDrop({
  zone,
  isActive,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  zone: KanbanTerminalDropZone;
  isActive: boolean;
  onDragOver: (zoneKey: string) => void;
  onDragLeave: () => void;
  onDrop: (zoneKey: string) => void;
}) {
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onDragOver(zone.key);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      onDrop={() => onDrop(zone.key)}
      className={cn(
        'flex min-h-14 flex-1 items-center justify-center rounded-xl border-2 border-dashed px-4 py-3 text-center text-sm font-semibold transition-all duration-200',
        zoneToneClass(zone.tone),
        isActive && 'scale-[1.02] shadow-md ring-2 ring-current/20 ring-inset',
      )}
    >
      {zone.label}
    </div>
  );
}
