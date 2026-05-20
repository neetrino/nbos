'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import {
  getTerminalDropStripEdge,
  KANBAN_TERMINAL_DROP_BAR_SHELL_CLASS,
  sortTerminalDropZonesForDisplay,
  terminalDropStripVisualClass,
  terminalDropZoneHitAreaClass,
  type TerminalDropStripEdge,
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
  const orderedZones = sortTerminalDropZonesForDisplay(zones);
  const hasActiveZone = activeZoneKey != null;

  return (
    <div className={cn(KANBAN_TERMINAL_DROP_BAR_SHELL_CLASS, 'pointer-events-none')}>
      {orderedZones.map((zone, index) => {
        const zoneId = deliveryKanbanTerminalId(zone.key as DeliveryTerminalDropKey);
        const isActive = activeZoneKey === zoneId;
        return (
          <TerminalDropZone
            key={zone.key}
            terminalKey={zone.key as DeliveryTerminalDropKey}
            zone={zone}
            edge={getTerminalDropStripEdge(index, orderedZones.length)}
            isActive={isActive}
            siblingActive={hasActiveZone && !isActive}
          />
        );
      })}
    </div>
  );
}

function TerminalDropZone({
  terminalKey,
  zone,
  edge,
  isActive,
  siblingActive,
}: {
  terminalKey: DeliveryTerminalDropKey;
  zone: KanbanTerminalDropZone;
  edge: TerminalDropStripEdge;
  isActive: boolean;
  siblingActive: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: deliveryKanbanTerminalId(terminalKey) });
  const highlighted = isActive || isOver;
  const siblingHighlighted = siblingActive && !highlighted;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        terminalDropZoneHitAreaClass(zone.tone, highlighted, siblingHighlighted),
        'pointer-events-auto',
      )}
    >
      <div className={terminalDropStripVisualClass(zone.tone, highlighted, edge)}>{zone.label}</div>
    </div>
  );
}
