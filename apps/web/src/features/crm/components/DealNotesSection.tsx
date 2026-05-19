'use client';

import { MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { DETAIL_SHEET_SECTION_BODY_CLASS, DetailSheetSection } from '@/components/shared';
import { DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS } from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';
import type { DealGeneralDraft } from './deal-general-form-state';

const NOTES_TEXTAREA_SHELL_CLASS = cn(
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  'border-border/60 bg-muted/20 flex w-full min-h-[88px] items-start rounded-xl border px-3 py-2 shadow-sm shadow-black/[0.04]',
);

interface DealNotesSectionProps {
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  disabled?: boolean;
  sectionClassName?: string;
}

export function DealNotesSection({
  draft,
  patchDraft,
  disabled = false,
  sectionClassName,
}: DealNotesSectionProps) {
  return (
    <DetailSheetSection
      title="Notes"
      icon={<MessageSquare size={12} />}
      className={sectionClassName}
    >
      <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
        <div className={NOTES_TEXTAREA_SHELL_CLASS}>
          <Textarea
            value={draft.notes ?? ''}
            onChange={(e) => patchDraft({ notes: e.target.value || null })}
            rows={3}
            disabled={disabled}
            placeholder="Add notes about this deal..."
            className="min-h-[72px] flex-1 resize-none border-0 bg-transparent px-0 py-1 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>
    </DetailSheetSection>
  );
}
