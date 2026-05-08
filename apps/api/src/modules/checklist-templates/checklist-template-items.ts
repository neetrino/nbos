import { randomUUID } from 'node:crypto';
import type { InputJsonValue } from '@nbos/database';

export const CHECKLIST_TEMPLATE_MAX_ITEMS = 200;

export interface ChecklistTemplateItemNormalized {
  id: string;
  title: string;
  instruction: string;
  decisionRequired: boolean;
  sortOrder: number;
}

export function normalizeChecklistTemplateItems(
  raw: Array<{
    id?: string;
    title: string;
    instruction: string;
    decisionRequired: boolean;
    sortOrder: number;
  }>,
): ChecklistTemplateItemNormalized[] {
  const sorted = [...raw].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted.map((row, index) => ({
    id: row.id?.trim() ? row.id.trim() : randomUUID(),
    title: row.title.trim(),
    instruction: row.instruction ?? '',
    decisionRequired: row.decisionRequired,
    sortOrder: index,
  }));
}

export function checklistItemsToJson(items: ChecklistTemplateItemNormalized[]): InputJsonValue {
  return items as unknown as InputJsonValue;
}
