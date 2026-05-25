'use client';

import type { ComponentType } from 'react';
import { AlignLeft, File, KeyRound, Link2, ListTodo, MessageSquare, Video } from 'lucide-react';
import {
  CHECKLIST_TEMPLATE_ITEM_EVIDENCE_TYPES,
  type ChecklistTemplateItemEvidenceType,
} from '@/lib/api/checklist-templates';
export { CHECKLIST_EVIDENCE_UPLOAD_TYPES } from '@/features/checklist/checklist-evidence-value';

/** Shared max width (rem) for type trigger and dropdown so both stay aligned. */
export const CHECKLIST_EVIDENCE_TYPE_SELECT_MAX_WIDTH_REM = 13.5 as const;

/** Evidence types for new steps / type picker (TASK + legacy split file types excluded). */
export const CHECKLIST_DRAFT_PICKABLE_EVIDENCE_TYPES: ChecklistTemplateItemEvidenceType[] =
  CHECKLIST_TEMPLATE_ITEM_EVIDENCE_TYPES.filter(
    (t) => t !== 'TASK_LINK' && t !== 'IMAGE_LINK' && t !== 'DOCUMENT_LINK',
  );

/** One-line label in compact selects and triggers. */
export const EVIDENCE_SHORT_LABEL: Record<ChecklistTemplateItemEvidenceType, string> = {
  TEXT_ONLY: 'Text',
  URL: 'URL',
  FILE_LINK: 'File',
  IMAGE_LINK: 'File',
  VIDEO_LINK: 'Video',
  DOCUMENT_LINK: 'File',
  CREDENTIAL_LINK: 'Credential',
  TASK_LINK: 'Task',
  FREE_TEXT: 'Answer',
};

/** Longer description for tooltips and secondary line in menus. */
export const EVIDENCE_MENU_HINT: Record<ChecklistTemplateItemEvidenceType, string> = {
  TEXT_ONLY: 'Instruction only — no attachment',
  URL: 'Expect a URL',
  FILE_LINK: 'Upload images, PDFs, or other files',
  IMAGE_LINK: 'Earlier “image” step — same as File',
  VIDEO_LINK: 'Link to a video',
  DOCUMENT_LINK: 'Earlier “document” step — same as File',
  CREDENTIAL_LINK: 'Link or reference to credentials',
  TASK_LINK: 'Link to a related task',
  FREE_TEXT: 'Team types an answer in a text field',
};

export const EVIDENCE_LONG_LABEL: Record<ChecklistTemplateItemEvidenceType, string> = {
  TEXT_ONLY: 'Text instruction only',
  URL: 'URL',
  FILE_LINK: 'File — uploads (images show preview)',
  IMAGE_LINK: 'File — image (legacy type)',
  VIDEO_LINK: 'Video (link)',
  DOCUMENT_LINK: 'File — document (legacy type)',
  CREDENTIAL_LINK: 'Credential link',
  TASK_LINK: 'Task link',
  FREE_TEXT: 'Free text answer',
};

export const EVIDENCE_ICON: Record<
  ChecklistTemplateItemEvidenceType,
  ComponentType<{ className?: string }>
> = {
  TEXT_ONLY: AlignLeft,
  URL: Link2,
  FILE_LINK: File,
  IMAGE_LINK: File,
  VIDEO_LINK: Video,
  DOCUMENT_LINK: File,
  CREDENTIAL_LINK: KeyRound,
  TASK_LINK: ListTodo,
  FREE_TEXT: MessageSquare,
};

export function EvidenceTypeIcon({
  type,
  className = 'size-4',
}: {
  type: ChecklistTemplateItemEvidenceType;
  className?: string;
}) {
  const Icon = EVIDENCE_ICON[type];
  return <Icon className={className} aria-hidden />;
}
