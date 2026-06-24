import { Building2, Globe, Link2, type LucideIcon } from 'lucide-react';
import type { TaskLink } from '@/lib/api/tasks';

export const TASK_CARD_CHIP_CLASS =
  'bg-muted/70 text-muted-foreground inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium';

export const TASK_CARD_ACTION_BTN_CLASS =
  'flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors';

/** Task board card due date — `dd.MM.yyyy`. */
export function formatTaskCardDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
}

export function formatAssigneeShortName(firstName: string, lastName: string): string {
  const initial = firstName.trim().charAt(0).toUpperCase();
  const last = lastName.trim();
  if (!initial && !last) return 'Unassigned';
  if (!last) return initial;
  return `${initial}. ${last}`;
}

export function linkChipIcon(entityType: string): LucideIcon {
  if (entityType === 'PROJECT') return Building2;
  if (entityType === 'PRODUCT' || entityType === 'EXTENSION') return Globe;
  return Link2;
}

/** Up to two chips: project first, then product/extension/order/deal. */
export function pickTaskCardLinkChips(links: TaskLink[]): TaskLink[] {
  if (links.length === 0) return [];

  const project = links.find((link) => link.entityType === 'PROJECT');
  const secondaryTypes = new Set(['PRODUCT', 'EXTENSION', 'ORDER', 'DEAL']);
  const secondary = links.find(
    (link) =>
      link !== project && secondaryTypes.has(link.entityType) && Boolean(link.entityLabel?.trim()),
  );
  const fallbackSecondary = links.find(
    (link) => link !== project && Boolean(link.entityLabel?.trim()),
  );

  const picked = [project, secondary ?? fallbackSecondary].filter(
    (link): link is TaskLink => link != null,
  );
  if (picked.length > 0) return picked.slice(0, 2);
  return links.slice(0, 2);
}
