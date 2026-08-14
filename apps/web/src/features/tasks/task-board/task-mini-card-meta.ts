import { FolderKanban, Layers, LayoutGrid, Link2, type LucideIcon } from 'lucide-react';
import type { Task, TaskLink } from '@/lib/api/tasks';

export const TASK_CARD_CHIP_CLASS =
  'inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium leading-none';

export const TASK_CARD_ACTION_BTN_CLASS =
  'flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors';

export type TaskCardContextKind = 'PROJECT' | 'PRODUCT' | 'WORK_SPACE' | 'OTHER';

export type TaskCardContextChip = {
  key: string;
  kind: TaskCardContextKind;
  label: string;
};

const MAX_TASK_CARD_CONTEXT_CHIPS = 2;

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

export function taskCardContextIcon(kind: TaskCardContextKind): LucideIcon {
  if (kind === 'PROJECT') return FolderKanban;
  if (kind === 'PRODUCT') return Layers;
  if (kind === 'WORK_SPACE') return LayoutGrid;
  return Link2;
}

export function taskCardContextChipClass(kind: TaskCardContextKind): string {
  if (kind === 'PROJECT') {
    return 'bg-sky-500/10 text-sky-800 dark:text-sky-300';
  }
  if (kind === 'PRODUCT') {
    return 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300';
  }
  if (kind === 'WORK_SPACE') {
    return 'bg-violet-500/10 text-violet-800 dark:text-violet-300';
  }
  return 'bg-muted/70 text-muted-foreground';
}

/**
 * Compact delivery context for board cards: Product → Project → Work Space,
 * then other labeled links. Max two chips.
 */
export function pickTaskCardContextChips(
  task: Pick<Task, 'links' | 'workspaceId' | 'workspace'>,
  options?: { hideWorkspace?: boolean },
): TaskCardContextChip[] {
  const chips: TaskCardContextChip[] = [];
  const links = task.links ?? [];

  const product = links.find((link) => link.entityType === 'PRODUCT' && Boolean(linkLabel(link)));
  const project = links.find((link) => link.entityType === 'PROJECT' && Boolean(linkLabel(link)));

  if (product) {
    chips.push({
      key: product.id,
      kind: 'PRODUCT',
      label: linkLabel(product)!,
    });
  }
  if (project && chips.length < MAX_TASK_CARD_CONTEXT_CHIPS) {
    chips.push({
      key: project.id,
      kind: 'PROJECT',
      label: linkLabel(project)!,
    });
  }

  if (!options?.hideWorkspace && chips.length < MAX_TASK_CARD_CONTEXT_CHIPS && task.workspaceId) {
    const workspaceName = task.workspace?.name?.trim();
    if (workspaceName) {
      chips.push({
        key: `ws:${task.workspaceId}`,
        kind: 'WORK_SPACE',
        label: workspaceName,
      });
    }
  }

  if (chips.length >= MAX_TASK_CARD_CONTEXT_CHIPS) return chips;

  for (const link of links) {
    if (link.entityType === 'PROJECT' || link.entityType === 'PRODUCT') continue;
    const label = linkLabel(link);
    if (!label) continue;
    chips.push({
      key: link.id,
      kind: 'OTHER',
      label,
    });
    if (chips.length >= MAX_TASK_CARD_CONTEXT_CHIPS) break;
  }

  return chips;
}

/** @deprecated Prefer {@link pickTaskCardContextChips}. */
export function pickTaskCardLinkChips(links: TaskLink[]): TaskLink[] {
  return pickTaskCardContextChips({ links, workspaceId: null, workspace: null }).flatMap((chip) => {
    const match = links.find((link) => link.id === chip.key);
    return match ? [match] : [];
  });
}

/** @deprecated Prefer {@link taskCardContextIcon}. */
export function linkChipIcon(entityType: string): LucideIcon {
  if (entityType === 'PROJECT') return FolderKanban;
  if (entityType === 'PRODUCT' || entityType === 'EXTENSION') return Layers;
  if (entityType === 'WORK_SPACE' || entityType === 'WORKSPACE') return LayoutGrid;
  return Link2;
}

function linkLabel(link: TaskLink): string | null {
  const label = link.entityLabel?.trim();
  return label || null;
}
