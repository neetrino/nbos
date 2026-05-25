import type { ChecklistTemplateItemEvidenceType } from '@nbos/shared';
import {
  appendChecklistEvidenceFileId,
  CHECKLIST_TEMPLATE_EVIDENCE_MAX_FILES,
  isChecklistFileAssetId,
  parseChecklistEvidenceFileAssetIds,
  removeChecklistEvidenceFileId,
} from '@nbos/shared';

/** @deprecated Use `isChecklistFileAssetId` from `@nbos/shared`. */
export const isUuidLike = isChecklistFileAssetId;

export { CHECKLIST_TEMPLATE_EVIDENCE_MAX_FILES, parseChecklistEvidenceFileAssetIds };

export const CHECKLIST_EVIDENCE_UPLOAD_TYPES = new Set<ChecklistTemplateItemEvidenceType>([
  'FILE_LINK',
  'IMAGE_LINK',
  'DOCUMENT_LINK',
]);

export function isHttpUrlString(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function appendEvidenceFileToChecklistValue(
  current: string | null,
  newFileAssetId: string,
): string {
  return appendChecklistEvidenceFileId(current, newFileAssetId);
}

export function removeEvidenceFileFromChecklistValue(
  current: string | null,
  fileAssetId: string,
): string | null {
  return removeChecklistEvidenceFileId(current, fileAssetId);
}
