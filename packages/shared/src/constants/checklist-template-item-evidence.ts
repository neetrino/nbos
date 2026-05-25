/**
 * Checklist template item evidence / input types (NBOS canon §10).
 * Stored on template version JSON `items`; copied into instance snapshots.
 */
export const CHECKLIST_TEMPLATE_ITEM_EVIDENCE_TYPES = [
  'TEXT_ONLY',
  'URL',
  'FILE_LINK',
  'IMAGE_LINK',
  'VIDEO_LINK',
  'DOCUMENT_LINK',
  'CREDENTIAL_LINK',
  'TASK_LINK',
  'FREE_TEXT',
] as const;

export type ChecklistTemplateItemEvidenceType =
  (typeof CHECKLIST_TEMPLATE_ITEM_EVIDENCE_TYPES)[number];

/** Types that require a non-empty `evidenceValue` (link or reference text). */
export const CHECKLIST_TEMPLATE_ITEM_EVIDENCE_LINKING_TYPES: ReadonlySet<ChecklistTemplateItemEvidenceType> =
  new Set([
    'URL',
    'FILE_LINK',
    'IMAGE_LINK',
    'VIDEO_LINK',
    'DOCUMENT_LINK',
    'CREDENTIAL_LINK',
    'TASK_LINK',
  ]);
