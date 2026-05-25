'use client';

import { MessageSquare } from 'lucide-react';
import { EntityNotesSection } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { DealGeneralDraft } from './deal-general-form-state';
import { dealStageGateFieldClass } from '@/features/crm/deal-stage-gate-highlight';

interface DealNotesSectionProps {
  entityId: string;
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  disabled?: boolean;
  sectionClassName?: string;
  gateRequiredFields?: ReadonlySet<string>;
}

export function DealNotesSection({
  entityId,
  draft,
  patchDraft,
  disabled = false,
  sectionClassName,
  gateRequiredFields = new Set(),
}: DealNotesSectionProps) {
  return (
    <EntityNotesSection
      title="Notes"
      icon={<MessageSquare size={12} />}
      sectionClassName={sectionClassName}
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
