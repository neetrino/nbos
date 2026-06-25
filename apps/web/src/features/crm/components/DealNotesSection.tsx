'use client';

import { EntityNotesSection, ENTITY_NOTES_OPTIONAL_PLACEHOLDER } from '@/components/shared';
import { cn } from '@/lib/utils';
import { dealStageGateFieldClass } from '@/features/crm/deal-stage-gate-highlight';
import type { DealGeneralDraft } from './deal-general-form-state';

interface DealNotesSectionProps {
  entityId: string;
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  disabled?: boolean;
  gateRequiredFields?: ReadonlySet<string>;
}

export function DealNotesSection({
  entityId,
  draft,
  patchDraft,
  disabled = false,
  gateRequiredFields = new Set(),
}: DealNotesSectionProps) {
  return (
    <EntityNotesSection
      entityType="deal"
      entityId={entityId}
      value={draft.notes}
      onChange={(notes) => patchDraft({ notes })}
      disabled={disabled}
      placeholder={ENTITY_NOTES_OPTIONAL_PLACEHOLDER}
      shellClassName={cn(dealStageGateFieldClass(gateRequiredFields, 'notes', ''))}
    />
  );
}
