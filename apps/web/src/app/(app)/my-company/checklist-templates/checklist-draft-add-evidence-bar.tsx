'use client';

import type { ComponentType } from 'react';
import {
  AlignLeft,
  File,
  FileText,
  Image as ImageIcon,
  KeyRound,
  Link2,
  ListTodo,
  MessageSquare,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CHECKLIST_TEMPLATE_ITEM_EVIDENCE_TYPES,
  type ChecklistTemplateItemEvidenceType,
} from '@/lib/api/checklist-templates';
import { cn } from '@/lib/utils';

const EVIDENCE_TOOLTIP: Record<ChecklistTemplateItemEvidenceType, string> = {
  TEXT_ONLY: 'Instruction only — no attachment',
  URL: 'Expect a URL',
  FILE_LINK: 'Link to a file',
  IMAGE_LINK: 'Link to an image',
  VIDEO_LINK: 'Link to a video',
  DOCUMENT_LINK: 'Link to PDF or document',
  CREDENTIAL_LINK: 'Link or reference to credentials',
  TASK_LINK: 'Link to a related task',
  FREE_TEXT: 'Team types an answer in a text field',
};

const EVIDENCE_ICON: Record<
  ChecklistTemplateItemEvidenceType,
  ComponentType<{ className?: string }>
> = {
  TEXT_ONLY: AlignLeft,
  URL: Link2,
  FILE_LINK: File,
  IMAGE_LINK: ImageIcon,
  VIDEO_LINK: Video,
  DOCUMENT_LINK: FileText,
  CREDENTIAL_LINK: KeyRound,
  TASK_LINK: ListTodo,
  FREE_TEXT: MessageSquare,
};

type Props = {
  disabled: boolean;
  atMax: boolean;
  onAdd: (evidenceType: ChecklistTemplateItemEvidenceType) => void;
};

export function ChecklistDraftAddEvidenceBar({ disabled, atMax, onAdd }: Props) {
  const blocked = disabled || atMax;

  return (
    <div className="border-border/80 bg-muted/40 rounded-xl border border-dashed p-4">
      <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
        Add checklist step
      </p>
      <p className="text-muted-foreground mb-3 text-sm">
        Choose the evidence shape for the next step. It is added at the bottom; use the handle to
        reorder.
      </p>
      <div className="flex flex-wrap gap-2">
        {CHECKLIST_TEMPLATE_ITEM_EVIDENCE_TYPES.map((type) => {
          const Icon = EVIDENCE_ICON[type];
          return (
            <Button
              key={type}
              type="button"
              variant="secondary"
              size="icon"
              disabled={blocked}
              className={cn('size-10 rounded-lg shadow-sm', blocked && 'opacity-50')}
              title={EVIDENCE_TOOLTIP[type]}
              aria-label={EVIDENCE_TOOLTIP[type]}
              onClick={() => onAdd(type)}
            >
              <Icon className="size-4" aria-hidden />
            </Button>
          );
        })}
      </div>
      {atMax ? (
        <p className="text-muted-foreground mt-3 text-xs">Maximum number of items reached.</p>
      ) : null}
    </div>
  );
}
