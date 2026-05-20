'use client';

import { useCallback, useRef, type DragEvent } from 'react';
import { cn } from '@/lib/utils';
import type { KanbanTerminalDropZone } from './kanban.types';
import {
  getTerminalDropStripEdge,
  KANBAN_TERMINAL_DROP_BAR_SHELL_CLASS,
  sortTerminalDropZonesForDisplay,
  terminalDropStripVisualClass,
  terminalDropZoneHitAreaClass,
  type TerminalDropStripEdge,
} from './kanban-terminal-drop-strip-classes';

interface KanbanTerminalDropBarProps {
  zones: KanbanTerminalDropZone[];
  activeZoneKey: string | null;
  onDragOver: (zoneKey: string) => void;
  onDragLeave: () => void;
  onDrop: (zoneKey: string) => void;
}

export function KanbanTerminalDropBar({
  zones,
  activeZoneKey,
  onDragOver,
  onDragLeave,
  onDrop,
}: KanbanTerminalDropBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const orderedZones = sortTerminalDropZonesForDisplay(zones);
  const hasActiveZone = activeZoneKey != null;

  const handleBarDragLeave = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      const related = event.relatedTarget;
      if (related instanceof Node && barRef.current?.contains(related)) return;
      onDragLeave();
    },
    [onDragLeave],
  );

  return (
    <div
      ref={barRef}
      className={KANBAN_TERMINAL_DROP_BAR_SHELL_CLASS}
      onDragLeave={handleBarDragLeave}
    >
      {orderedZones.map((zone, index) => {
        const isActive = activeZoneKey === zone.key;
        return (
          <ZoneDrop
            key={zone.key}
            zone={zone}
            edge={getTerminalDropStripEdge(index, orderedZones.length)}
            isActive={isActive}
            siblingActive={hasActiveZone && !isActive}
            onDragOver={onDragOver}
            onDrop={onDrop}
          />
        );
      })}
    </div>
  );
}

function ZoneDrop({
  zone,
  edge,
  isActive,
  siblingActive,
  onDragOver,
  onDrop,
}: {
  zone: KanbanTerminalDropZone;
  edge: TerminalDropStripEdge;
  isActive: boolean;
  siblingActive: boolean;
  onDragOver: (zoneKey: string) => void;
  onDrop: (zoneKey: string) => void;
}) {
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onDragOver(zone.key);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={() => onDrop(zone.key)}
      className={terminalDropZoneHitAreaClass(zone.tone, isActive, siblingActive)}
    >
      <div className={cn(terminalDropStripVisualClass(zone.tone, isActive, edge))}>
        {zone.label}
      </div>
    </div>
  );
}
