import { randomUUID } from 'node:crypto';
import type { InputJsonValue } from '@nbos/database';
import {
  CHECKLIST_TEMPLATE_ITEM_EVIDENCE_LINKING_TYPES,
  CHECKLIST_TEMPLATE_ITEM_EVIDENCE_TYPES,
  type ChecklistTemplateItemEvidenceType,
} from '@nbos/shared';

export const CHECKLIST_TEMPLATE_MAX_ITEMS = 200;

const EVIDENCE_VALUE_MAX = 2000;
const EVIDENCE_LABEL_MAX = 200;

export interface ChecklistTemplateItemNormalized {
  id: string;
  title: string;
  instruction: string;
  decisionRequired: boolean;
  sortOrder: number;
  evidenceType: ChecklistTemplateItemEvidenceType;
  evidenceValue: string | null;
  evidenceLabel: string | null;
}

function parseEvidenceType(raw: unknown): ChecklistTemplateItemEvidenceType {
  if (typeof raw !== 'string') {
    return 'TEXT_ONLY';
  }
  return (CHECKLIST_TEMPLATE_ITEM_EVIDENCE_TYPES as readonly string[]).includes(raw)
    ? (raw as ChecklistTemplateItemEvidenceType)
    : 'TEXT_ONLY';
}

function trimOrNull(s: unknown, max: number): string | null {
  if (typeof s !== 'string') {
    return null;
  }
  const t = s.trim();
  if (!t) {
    return null;
  }
  return t.length > max ? t.slice(0, max) : t;
}

export function validateChecklistTemplateEvidenceFields(
  item: ChecklistTemplateItemNormalized,
  index: number,
): string | undefined {
  const n = index + 1;
  if (CHECKLIST_TEMPLATE_ITEM_EVIDENCE_LINKING_TYPES.has(item.evidenceType)) {
    const v = item.evidenceValue?.trim() ?? '';
    if (!v) {
      return `Item ${n}: add a link or reference for evidence type ${item.evidenceType}.`;
    }
    if (item.evidenceType === 'URL') {
      try {
        const u = new URL(v);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          return `Item ${n}: URL must start with http:// or https://.`;
        }
      } catch {
        return `Item ${n}: invalid URL.`;
      }
    }
  }
  if (item.evidenceType !== 'FREE_TEXT' && item.evidenceLabel) {
    return `Item ${n}: evidence label applies only to FREE_TEXT type.`;
  }
  return undefined;
}

export interface ChecklistTemplateItemDraftInput {
  id?: string;
  title: string;
  instruction: string;
  decisionRequired: boolean;
  sortOrder: number;
  evidenceType?: ChecklistTemplateItemEvidenceType;
  evidenceValue?: string | null;
  evidenceLabel?: string | null;
}

export function normalizeChecklistTemplateItems(
  raw: ChecklistTemplateItemDraftInput[],
): ChecklistTemplateItemNormalized[] {
  const sorted = [...raw].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted.map((row, index) => {
    const evidenceType = parseEvidenceType(row.evidenceType);
    const evidenceValue =
      evidenceType === 'TEXT_ONLY' || evidenceType === 'FREE_TEXT'
        ? null
        : trimOrNull(row.evidenceValue, EVIDENCE_VALUE_MAX);
    const evidenceLabel =
      evidenceType === 'FREE_TEXT' ? trimOrNull(row.evidenceLabel, EVIDENCE_LABEL_MAX) : null;
    return {
      id: row.id?.trim() ? row.id.trim() : randomUUID(),
      title: row.title.trim(),
      instruction: row.instruction ?? '',
      decisionRequired: row.decisionRequired,
      sortOrder: index,
      evidenceType,
      evidenceValue,
      evidenceLabel,
    };
  });
}

export function checklistItemsToJson(items: ChecklistTemplateItemNormalized[]): InputJsonValue {
  return items as unknown as InputJsonValue;
}
