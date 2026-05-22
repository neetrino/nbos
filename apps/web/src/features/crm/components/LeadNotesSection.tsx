'use client';

import { MessageSquare } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetSection,
  EntityNotesField,
} from '@/components/shared';
import { cn } from '@/lib/utils';
import type { LeadGeneralDraft } from './lead-general-form-state';
import { leadStageGateFieldClass } from '@/features/crm/lead-stage-gate-highlight';

interface LeadNotesSectionProps {
  id?: string;
  entityId: string;
  draft: LeadGeneralDraft;
  patchDraft: (partial: Partial<LeadGeneralDraft>) => void;
  disabled?: boolean;
  gateRequiredFields?: ReadonlySet<string>;
}

export function LeadNotesSection({
  id,
  entityId,
  draft,
  patchDraft,
  disabled = false,
  gateRequiredFields = new Set(),
}: LeadNotesSectionProps) {
  return (
    <DetailSheetSection id={id} title="Notes" icon={<MessageSquare size={12} />}>
      <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
        <EntityNotesField
          entityType="lead"
          entityId={entityId}
          value={draft.notes}
          onChange={(notes) => patchDraft({ notes })}
          disabled={disabled}
          placeholder="Add notes about this lead…"
          shellClassName={cn(leadStageGateFieldClass(gateRequiredFields, 'notes', ''))}
        />
      </div>
    </DetailSheetSection>
  );
}
