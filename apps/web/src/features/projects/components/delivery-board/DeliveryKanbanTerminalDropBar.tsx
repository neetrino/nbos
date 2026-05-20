'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import {
  KANBAN_TERMINAL_DROP_BAR_SHELL_CLASS,
  terminalDropStripClass,
} from '@/components/shared/kanban/kanban-terminal-drop-strip-classes';
import type { KanbanTerminalDropZone } from '@/components/shared/kanban/kanban.types';
import { deliveryKanbanTerminalId, type DeliveryTerminalDropKey } from './delivery-kanban-ids';

export function DeliveryKanbanTerminalDropBar({
  zones,
  activeZoneKey,
}: {
  zones: KanbanTerminalDropZone[];
  activeZoneKey: string | null;
}) {
  return (
    <div className={cn(KANBAN_TERMINAL_DROP_BAR_SHELL_CLASS, 'pointer-events-none')}>
      {zones.map((zone) => (
        <TerminalDropZone
          key={zone.key}
          terminalKey={zone.key as DeliveryTerminalDropKey}
          zone={zone}
          isActive={activeZoneKey === deliveryKanbanTerminalId(zone.key as DeliveryTerminalDropKey)}
        />
      ))}
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
      className={cn(terminalDropStripClass(zone.tone, highlighted), 'pointer-events-auto')}
    >
      {zone.label}
    </div>
  );
}
