import {
  FileText,
  FolderKanban,
  Handshake,
  Headphones,
  Layers,
  LayoutGrid,
  Link2,
  Puzzle,
  Receipt,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

/** Task link entity types used in the sheet (display + editable delivery context). */

export const TASK_LINK_ENTITY_LABELS: Record<string, string> = {
  PROJECT: 'Project',
  PRODUCT: 'Product',
  EXTENSION: 'Extension',
  ORDER: 'Order',
  DEAL: 'Deal',
  LEAD: 'Lead',
  INVOICE: 'Invoice',
  SUPPORT_TICKET: 'Ticket',
  WORK_SPACE: 'Work Space',
  WORKSPACE: 'Work Space',
};

/** Only these can be connected/disconnected from the task sheet. */
export const TASK_EDITABLE_LINK_TYPES = ['PROJECT', 'PRODUCT'] as const;

export type TaskEditableLinkType = (typeof TASK_EDITABLE_LINK_TYPES)[number];

export function isTaskEditableLinkType(entityType: string): entityType is TaskEditableLinkType {
  return entityType === 'PROJECT' || entityType === 'PRODUCT';
}

export function taskLinkEntityLabel(entityType: string): string {
  return TASK_LINK_ENTITY_LABELS[entityType] ?? entityType;
}

/** Canonical entity icons for task links / board chips (Deal = Handshake, etc.). */
export function taskLinkEntityIcon(entityType: string): LucideIcon {
  switch (entityType) {
    case 'PROJECT':
      return FolderKanban;
    case 'PRODUCT':
      return Layers;
    case 'EXTENSION':
      return Puzzle;
    case 'WORK_SPACE':
    case 'WORKSPACE':
      return LayoutGrid;
    case 'DEAL':
      return Handshake;
    case 'LEAD':
      return UserRound;
    case 'ORDER':
      return FileText;
    case 'INVOICE':
      return Receipt;
    case 'SUPPORT_TICKET':
      return Headphones;
    default:
      return Link2;
  }
}
