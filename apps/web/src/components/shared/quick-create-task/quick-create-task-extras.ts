import type { TaskDeliveryContextKind } from '@/features/tasks/utils/search-task-delivery-context';

export type QuickCreateDraftLink = {
  kind: TaskDeliveryContextKind;
  entityId: string;
  label: string;
  contextLabel: string | null;
};

export type QuickCreateDraftChecklistItem = {
  localId: string;
  text: string;
  checked: boolean;
};

export type QuickCreateDraftChecklist = {
  localId: string;
  title: string;
  items: QuickCreateDraftChecklistItem[];
};

let nextQuickCreateDraftId = 0;

/** Session-local React keys for draft checklists. Not persisted and not a UUID. */
export function newQuickCreateDraftId(): string {
  nextQuickCreateDraftId += 1;
  return `qc-draft-${nextQuickCreateDraftId}`;
}

export function encodeQuickCreateDraftLinkValue(link: QuickCreateDraftLink): string {
  return `${link.kind}:${link.entityId}`;
}

export function checklistDraftItemCount(checklists: readonly QuickCreateDraftChecklist[]): number {
  return checklists.reduce((sum, list) => sum + list.items.length, 0);
}
