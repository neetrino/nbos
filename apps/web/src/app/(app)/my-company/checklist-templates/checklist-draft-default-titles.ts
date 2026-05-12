import type { ChecklistTemplateItemEvidenceType } from '@/lib/api/checklist-templates';

/** Short default titles when adding a new draft item by evidence type. */
export const CHECKLIST_DRAFT_DEFAULT_TITLE_BY_EVIDENCE: Record<
  ChecklistTemplateItemEvidenceType,
  string
> = {
  TEXT_ONLY: 'New text step',
  URL: 'New link step',
  FILE_LINK: 'New file link step',
  IMAGE_LINK: 'New image step',
  VIDEO_LINK: 'New video step',
  DOCUMENT_LINK: 'New document step',
  CREDENTIAL_LINK: 'New credential step',
  TASK_LINK: 'New task link step',
  FREE_TEXT: 'New free-text answer',
};
