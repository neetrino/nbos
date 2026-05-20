import type { KanbanTerminalDropZone } from '@/components/shared/kanban/kanban.types';

export const DELIVERY_TERMINAL_DROP_ZONES: KanbanTerminalDropZone[] = [
  { key: 'DONE', label: 'Done', tone: 'success' },
  { key: 'CANCELLED', label: 'Cancelled', tone: 'danger' },
];
