'use client';

import { MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { DETAIL_SHEET_SECTION_BODY_CLASS, DetailSheetSection } from '@/components/shared';
import { DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS } from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';
import type { LeadGeneralDraft } from './lead-general-form-state';
import { leadStageGateFieldClass } from '@/features/crm/lead-stage-gate-highlight';

const NOTES_TEXTAREA_SHELL_CLASS = cn(
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  'border-border/60 bg-muted/20 flex w-full min-h-[88px] items-start rounded-xl border px-3 py-2 shadow-sm shadow-black/[0.04]',
);

interface LeadNotesSectionProps {
  id?: string;
  draft: LeadGeneralDraft;
  patchDraft: (partial: Partial<LeadGeneralDraft>) => void;
  disabled?: boolean;
  gateRequiredFields?: ReadonlySet<string>;
}

export function LeadNotesSection({
  id,
  draft,
  patchDraft,
  disabled = false,
  gateRequiredFields = new Set(),
}: LeadNotesSectionProps) {
  return (
    <DetailSheetSection id={id} title="Notes" icon={<MessageSquare size={12} />}>
      <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
        <div
          className={cn(
            NOTES_TEXTAREA_SHELL_CLASS,
            leadStageGateFieldClass(gateRequiredFields, 'notes', ''),
          )}
        >
          <Textarea
            value={draft.notes ?? ''}
            onChange={(e) => patchDraft({ notes: e.target.value || null })}
            rows={3}
            disabled={disabled}
            placeholder="Add notes about this lead…"
            className="min-h-[72px] flex-1 resize-none border-0 bg-transparent px-0 py-1 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>
    </DetailSheetSection>
  );
}
