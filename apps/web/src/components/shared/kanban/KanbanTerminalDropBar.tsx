'use client';

import type { DragEvent } from 'react';
import { cn } from '@/lib/utils';
import type { KanbanTerminalDropZone } from './kanban.types';
import {
  KANBAN_TERMINAL_DROP_BAR_SHELL_CLASS,
  terminalDropStripClass,
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
  return (
    <div className={KANBAN_TERMINAL_DROP_BAR_SHELL_CLASS}>
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
      className={cn(terminalDropStripClass(zone.tone, isActive))}
    >
      {zone.label}
    </div>
  );
}
