import type { RelationCreatedEvent } from '@/components/shared/relation-picker';
import type { ProjectContactsDraft } from './project-contacts-state';

/** Maps inline create from {@link EntityRelationHost} onto project contacts draft. */
export function applyProjectContactsRelationCreated(
  draft: ProjectContactsDraft,
  event: RelationCreatedEvent,
): ProjectContactsDraft {
  if (event.kind === 'contact' && event.intent === 'project-contacts') {
    if (draft.contactIds.includes(event.id)) return draft;
    return {
      ...draft,
      contactIds: [...draft.contactIds, event.id],
      contactLabels: { ...draft.contactLabels, [event.id]: event.label },
    };
  }
  if (event.kind === 'company' && event.intent === 'project-company') {
    return { ...draft, companyId: event.id, companyLabel: event.label };
  }
  return draft;
}
