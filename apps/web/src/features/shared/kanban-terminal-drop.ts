import type { KanbanTerminalDropZone } from '@/components/shared/kanban/kanban.types';
import {
  resolveBoardLifecycleScope,
  type BoardLifecycleScope,
  type BoardStageDefinition,
} from '@/features/shared/board-lifecycle';

export interface TerminalDropStageSource extends BoardStageDefinition {
  label: string;
}

export function terminalDropTone(statusKey: string): KanbanTerminalDropZone['tone'] {
  if (
    statusKey === 'FAILED' ||
    statusKey === 'SPAM' ||
    statusKey === 'CANCELLED' ||
    statusKey === 'CLOSED' ||
    statusKey === 'LOST' ||
    statusKey === 'WRITTEN_OFF' ||
    statusKey === 'DUPLICATE'
  ) {
    return 'danger';
  }
  if (
    statusKey === 'WON' ||
    statusKey === 'SQL' ||
    statusKey === 'PAID' ||
    statusKey === 'RESOLVED' ||
    statusKey === 'COMPLETED' ||
    statusKey === 'DONE'
  ) {
    return 'success';
  }
  return 'neutral';
}

export function buildTerminalDropZones(
  stages: readonly TerminalDropStageSource[],
): KanbanTerminalDropZone[] {
  return stages
    .filter((stage) => stage.terminal)
    .map((stage) => ({
      key: stage.key,
      label: stage.label,
      tone: terminalDropTone(stage.key),
    }));
}

export function buildTerminalDropZonesFromBoard(
  stages: readonly BoardStageDefinition[],
  labelByKey: Readonly<Record<string, string>>,
): KanbanTerminalDropZone[] {
  return stages
    .filter((stage) => stage.terminal)
    .map((stage) => ({
      key: stage.key,
      label: labelByKey[stage.key] ?? stage.key,
      tone: terminalDropTone(stage.key),
    }));
}

export function shouldShowTerminalDropBar(scopeValue: string | undefined): boolean {
  const scope: BoardLifecycleScope = resolveBoardLifecycleScope(scopeValue);
  return scope === 'ACTIVE';
}
