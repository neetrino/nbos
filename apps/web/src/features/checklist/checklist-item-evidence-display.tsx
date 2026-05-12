'use client';

import Link from 'next/link';
import {
  CHECKLIST_TEMPLATE_ITEM_EVIDENCE_LINKING_TYPES,
  type ChecklistTemplateItemEvidenceType,
} from '@/lib/api/checklist-templates';

const EVIDENCE_SUMMARY: Record<ChecklistTemplateItemEvidenceType, string> = {
  TEXT_ONLY: '',
  URL: 'Link',
  FILE_LINK: 'File link',
  IMAGE_LINK: 'Image link',
  VIDEO_LINK: 'Video link',
  DOCUMENT_LINK: 'Document link',
  CREDENTIAL_LINK: 'Credential link',
  TASK_LINK: 'Task link',
  FREE_TEXT: 'Free text answer',
};

type EvidenceFields = {
  evidenceType: ChecklistTemplateItemEvidenceType;
  evidenceValue: string | null;
  evidenceLabel: string | null;
};

export function ChecklistItemEvidenceDisplay({ item }: { item: EvidenceFields }) {
  if (item.evidenceType === 'TEXT_ONLY') {
    return null;
  }

  const label = EVIDENCE_SUMMARY[item.evidenceType];
  const href =
    item.evidenceValue && /^https?:\/\//i.test(item.evidenceValue) ? item.evidenceValue : null;

  return (
    <div className="text-muted-foreground mt-2 space-y-1 border-t border-dashed pt-2 text-xs">
      <p>
        <span className="text-foreground font-medium">{label}</span>
        {item.evidenceType === 'FREE_TEXT' && item.evidenceLabel ? (
          <span className="ml-1">· {item.evidenceLabel}</span>
        ) : null}
      </p>
      {CHECKLIST_TEMPLATE_ITEM_EVIDENCE_LINKING_TYPES.has(item.evidenceType) &&
      item.evidenceValue ? (
        href ? (
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-block max-w-full truncate underline-offset-2 hover:underline"
          >
            {item.evidenceValue}
          </Link>
        ) : (
          <p className="font-mono text-[11px] break-all">{item.evidenceValue}</p>
        )
      ) : null}
    </div>
  );
}
