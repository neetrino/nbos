import type { LucideIcon } from 'lucide-react';
import type { Task, TaskLink } from '@/lib/api/tasks';
import { taskLinkEntityIcon, taskLinkEntityLabel } from '../constants/task-link-entities';

export const TASK_CARD_CHIP_CLASS =
  'inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium leading-none';

export const TASK_CARD_ACTION_BTN_CLASS =
  'flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors';

export type TaskCardContextKind = 'PROJECT' | 'PRODUCT' | 'WORK_SPACE' | 'OTHER';

export type TaskCardContextChip = {
  key: string;
  kind: TaskCardContextKind;
  entityType: string;
  label: string;
};

/** Work Space first (planning home), then Product / Project / other. */
const MAX_TASK_CARD_CONTEXT_CHIPS = 3;

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

export function taskCardContextIcon(chip: Pick<TaskCardContextChip, 'entityType'>): LucideIcon {
  return taskLinkEntityIcon(chip.entityType);
}

export function taskCardContextChipClass(kind: TaskCardContextKind, entityType?: string): string {
  if (kind === 'PROJECT' || entityType === 'PROJECT') {
    return 'bg-sky-500/10 text-sky-800 dark:text-sky-300';
  }
  if (kind === 'PRODUCT' || entityType === 'PRODUCT') {
    return 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300';
  }
  if (kind === 'WORK_SPACE' || entityType === 'WORK_SPACE' || entityType === 'WORKSPACE') {
    return 'bg-violet-500/10 text-violet-800 dark:text-violet-300';
  }
  if (entityType === 'DEAL') {
    return 'bg-blue-500/10 text-blue-800 dark:text-blue-300';
  }
  return 'bg-muted/70 text-muted-foreground';
}

/**
 * Board card context chips. Work Space is first so it survives reload alongside
 * project/product links (was previously crowded out by a 2-chip Product→Project order).
 */
export function pickTaskCardContextChips(
  task: Pick<Task, 'links' | 'workspaceId' | 'workspace'>,
  options?: { hideWorkspace?: boolean },
): TaskCardContextChip[] {
  const chips: TaskCardContextChip[] = [];
  const links = task.links ?? [];

  if (!options?.hideWorkspace && task.workspaceId) {
    chips.push({
      key: `ws:${task.workspaceId}`,
      kind: 'WORK_SPACE',
      entityType: 'WORK_SPACE',
      label: task.workspace?.name?.trim() || taskLinkEntityLabel('WORK_SPACE'),
    });
  }

  const product = links.find((link) => link.entityType === 'PRODUCT');
  const project = links.find((link) => link.entityType === 'PROJECT');

  if (product && chips.length < MAX_TASK_CARD_CONTEXT_CHIPS) {
    chips.push({
      key: product.id,
      kind: 'PRODUCT',
      entityType: 'PRODUCT',
      label: linkDisplayLabel(product),
    });
  }
  if (project && chips.length < MAX_TASK_CARD_CONTEXT_CHIPS) {
    chips.push({
      key: project.id,
      kind: 'PROJECT',
      entityType: 'PROJECT',
      label: linkDisplayLabel(project),
    });
  }

  if (chips.length >= MAX_TASK_CARD_CONTEXT_CHIPS) return chips;

  for (const link of links) {
    if (link.entityType === 'PROJECT' || link.entityType === 'PRODUCT') continue;
    const label = link.entityLabel?.trim();
    if (!label) continue;
    chips.push({
      key: link.id,
      kind: 'OTHER',
      entityType: link.entityType,
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

/** @deprecated Prefer {@link taskLinkEntityIcon}. */
export function linkChipIcon(entityType: string): LucideIcon {
  return taskLinkEntityIcon(entityType);
}

function linkDisplayLabel(link: TaskLink): string {
  return link.entityLabel?.trim() || taskLinkEntityLabel(link.entityType);
}
