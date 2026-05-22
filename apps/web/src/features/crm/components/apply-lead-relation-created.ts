import type { RelationCreatedEvent } from '@/components/shared/relation-picker';
import type { LeadGeneralDraft } from './lead-general-form-state';

/** Maps a relation create event from {@link EntityRelationHost} onto lead general draft fields. */
export function applyLeadRelationCreated(
  draft: LeadGeneralDraft,
  event: RelationCreatedEvent,
): LeadGeneralDraft {
  switch (event.kind) {
    case 'contact':
      if (event.intent === 'lead-source-contact') {
        return { ...draft, sourceContactId: event.id, clientPickLabel: event.label };
      }
      return draft;
    case 'partner':
      return { ...draft, sourcePartnerId: event.id, partnerPickLabel: event.label };
    default:
      return draft;
  }
}
