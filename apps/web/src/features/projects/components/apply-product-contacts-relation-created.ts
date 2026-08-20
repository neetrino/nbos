import type { RelationCreatedEvent } from '@/components/shared/relation-picker';
import type { ProductContactsDraft } from './product-contacts-state';

export function applyProductContactsRelationCreated(
  draft: ProductContactsDraft,
  event: RelationCreatedEvent,
): ProductContactsDraft {
  if (event.kind === 'contact' && event.intent === 'product-contacts') {
    if (draft.contactIds.includes(event.id)) return draft;
    return {
      ...draft,
      contactIds: [...draft.contactIds, event.id],
      contactLabels: { ...draft.contactLabels, [event.id]: event.label },
    };
  }
  return draft;
}
