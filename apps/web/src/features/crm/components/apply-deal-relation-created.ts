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
      if (event.intent === 'deal-contacts') {
        if (draft.contactIds.includes(event.id)) return draft;
        return {
          ...draft,
          contactIds: [...draft.contactIds, event.id],
          contactLabels: { ...draft.contactLabels, [event.id]: event.label },
        };
      }
      return draft;
    case 'partner':
      return { ...draft, sourcePartnerId: event.id, partnerPickLabel: event.label };
    case 'product':
      if (event.intent === 'deal-existing-product') {
        return {
          ...draft,
          existingProductId: event.id,
          existingProductPickLabel: event.label,
        };
      }
      return draft;
    default:
      return draft;
  }
}
