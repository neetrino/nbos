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
      if (event.intent === 'lead-additional-contact') {
        if (draft.additionalContactIds.includes(event.id)) return draft;
        return {
          ...draft,
          additionalContactIds: [...draft.additionalContactIds, event.id],
          additionalContactLabels: {
            ...draft.additionalContactLabels,
            [event.id]: event.label,
          },
        };
      }
      return draft;
    case 'partner':
      return { ...draft, sourcePartnerId: event.id, partnerPickLabel: event.label };
    default:
      return draft;
  }
}
