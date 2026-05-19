'use client';

import { MessageSquare } from 'lucide-react';
import { DetailSheetSection, InlineField } from '@/components/shared';
import type { DealGeneralDraft } from './deal-general-form-state';

interface DealNotesSectionProps {
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  disabled?: boolean;
}

export function DealNotesSection({ draft, patchDraft, disabled = false }: DealNotesSectionProps) {
  return (
    <DetailSheetSection title="Notes" icon={<MessageSquare size={12} />}>
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
    </DetailSheetSection>
  );
}
