'use client';

import { DetailSheetOptionalDescription } from '@/components/shared';
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
    <DetailSheetOptionalDescription
      id={id}
      entityType="lead"
      entityId={entityId}
      value={draft.notes}
      onChange={(notes) => patchDraft({ notes })}
      disabled={disabled}
      shellClassName={cn(leadStageGateFieldClass(gateRequiredFields, 'notes', ''))}
    />
  );
}
