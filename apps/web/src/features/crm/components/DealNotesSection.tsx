'use client';

import { MessageSquare } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetSection,
  InlineField,
} from '@/components/shared';
import type { DealGeneralDraft } from './deal-general-form-state';

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
        <InlineField
          variant="controlled"
          label="Notes"
          value={draft.notes ?? ''}
          type="textarea"
          placeholder="Add notes about this deal..."
          icon={<MessageSquare size={12} />}
          disabled={disabled}
          onValueChange={(v) => patchDraft({ notes: v || null })}
        />
      </div>
    </DetailSheetSection>
  );
}
