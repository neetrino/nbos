import type { RelationCreatedEvent } from '@/components/shared/relation-picker';
import type { DealGeneralDraft } from './deal-general-form-state';

/** Maps a relation create event from {@link EntityRelationHost} onto deal general draft fields. */
export function applyDealRelationCreated(
  draft: DealGeneralDraft,
  event: RelationCreatedEvent,
): DealGeneralDraft {
  switch (event.kind) {
    case 'project':
      return { ...draft, projectId: event.id, linkedProjectLabel: event.label };
    case 'company':
      return { ...draft, companyId: event.id, companyPickLabel: event.label };
    case 'contact':
      if (event.intent === 'deal-source-contact') {
        return { ...draft, sourceContactId: event.id, clientPickLabel: event.label };
      }
      return { ...draft, contactId: event.id, contactDisplayLabel: event.label };
    case 'partner':
      return { ...draft, sourcePartnerId: event.id, partnerPickLabel: event.label };
    default:
      return draft;
  }
}
