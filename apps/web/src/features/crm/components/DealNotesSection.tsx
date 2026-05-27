'use client';

import { EntityNotesSection } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { DealGeneralDraft } from './deal-general-form-state';
import { dealStageGateFieldClass } from '@/features/crm/deal-stage-gate-highlight';

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
      placeholder="Add notes about this deal…"
      shellClassName={cn(dealStageGateFieldClass(gateRequiredFields, 'notes', ''))}
    />
  );
}
