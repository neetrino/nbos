import type { ReactNode } from 'react';

export interface KanbanColumn<T> {
  key: string;
  label: string;
  color: string;
  hexColor?: string;
  items: T[];
  readonly?: boolean;
}

export interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[];
  renderCard: (item: T, columnKey: string) => ReactNode;
  renderColumnHeader?: (column: KanbanColumn<T>) => ReactNode;
  onMove?: (itemId: string, fromColumn: string, toColumn: string) => void;
  getItemId: (item: T) => string;
  columnWidth?: number;
  emptyMessage?: string;
  onAddColumn?: (title: string, color: string, afterColumnKey?: string) => void;
  onRenameColumn?: (columnKey: string, newTitle: string, newColor: string) => void;
  onDeleteColumn?: (columnKey: string) => void;
  /** "+" button at top of each column: on click open create form; label shown on hover */
  onAddItemInColumn?: (columnKey: string) => void;
  addButtonLabel?: string;
}

export const SCROLL_SPEED = 6;
export const EDGE_ZONE_WIDTH = 48;

export const COLOR_PALETTE = [
  '#3B82F6',
  '#2563EB',
  '#1D4ED8',
  '#8B5CF6',
  '#7C3AED',
  '#6D28D9',
  '#EC4899',
  '#DB2777',
  '#BE185D',
  '#EF4444',
  '#DC2626',
  '#B91C1C',
  '#F97316',
  '#EA580C',
  '#C2410C',
  '#F59E0B',
  '#D97706',
  '#B45309',
  '#EAB308',
  '#CA8A04',
  '#A16207',
  '#22C55E',
  '#16A34A',
  '#15803D',
  '#10B981',
  '#059669',
  '#047857',
  '#14B8A6',
  '#0D9488',
  '#0F766E',
  '#06B6D4',
  '#0891B2',
  '#0E7490',
  '#6B7280',
  '#4B5563',
  '#374151',
];

/**
 * WCAG luminance-based contrast: returns '#fff' or '#000'
 * depending on background brightness.
 */
export function contrastText(hex: string): '#fff' | '#000' {
  const raw = hex.replace('#', '');
  const r = parseInt(raw.substring(0, 2), 16);
  const g = parseInt(raw.substring(2, 4), 16);
  const b = parseInt(raw.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#000' : '#fff';
}

export function getColumnHex<T>(col: KanbanColumn<T>): string | undefined {
  if (col.hexColor) return col.hexColor;
  const match = col.color.match(/^#[0-9A-Fa-f]{6}$/);
  return match ? col.color : undefined;
}
