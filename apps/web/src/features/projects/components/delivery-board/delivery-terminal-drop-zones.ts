import type { KanbanTerminalDropZone } from '@/components/shared/kanban/kanban.types';

export const DELIVERY_TERMINAL_DROP_ZONES: KanbanTerminalDropZone[] = [
  { key: 'CANCELLED', label: 'Cancelled', tone: 'danger' },
  { key: 'DONE', label: 'Done', tone: 'success' },
];
