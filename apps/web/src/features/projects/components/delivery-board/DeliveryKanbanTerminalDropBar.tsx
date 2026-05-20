'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { KanbanTerminalDropZone } from '@/components/shared/kanban/kanban.types';
import { deliveryKanbanTerminalId, type DeliveryTerminalDropKey } from './delivery-kanban-ids';

function zoneToneClass(tone: KanbanTerminalDropZone['tone']): string {
  if (tone === 'danger') {
    return 'border-red-300/80 bg-red-50/90 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200';
  }
  if (tone === 'success') {
    return 'border-emerald-300/80 bg-emerald-50/90 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200';
  }
  return 'border-stone-300/80 bg-stone-50/90 text-stone-700 dark:border-stone-600 dark:bg-stone-900/50 dark:text-stone-200';
}

export function DeliveryKanbanTerminalDropBar({
  zones,
  activeZoneKey,
}: {
  zones: KanbanTerminalDropZone[];
  activeZoneKey: string | null;
}) {
  return (
    <div className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 pointer-events-none fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] backdrop-blur-md">
      <p className="text-muted-foreground mb-2 text-center text-[11px] font-medium tracking-wide uppercase">
        Drop to close
      </p>
      <div className="pointer-events-auto mx-auto flex max-w-4xl gap-3">
        {zones.map((zone) => (
          <TerminalDropZone
            key={zone.key}
            terminalKey={zone.key as DeliveryTerminalDropKey}
            zone={zone}
            isActive={
              activeZoneKey === deliveryKanbanTerminalId(zone.key as DeliveryTerminalDropKey)
            }
          />
        ))}
      </div>
    </div>
  );
}

function TerminalDropZone({
  terminalKey,
  zone,
  isActive,
}: {
  terminalKey: DeliveryTerminalDropKey;
  zone: KanbanTerminalDropZone;
  isActive: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: deliveryKanbanTerminalId(terminalKey) });
  const highlighted = isActive || isOver;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-14 flex-1 items-center justify-center rounded-xl border-2 border-dashed px-4 py-3 text-center text-sm font-semibold transition-all duration-200',
        zoneToneClass(zone.tone),
        highlighted && 'scale-[1.02] shadow-md ring-2 ring-current/20 ring-inset',
      )}
    >
      {zone.label}
    </div>
  );
}
