import type { RelationCreatedEvent } from '@/components/shared/relation-picker';
import type { ProjectContactsDraft } from './project-contacts-state';

/** Maps inline create from {@link EntityRelationHost} onto project contacts draft. */
export function applyProjectContactsRelationCreated(
  draft: ProjectContactsDraft,
  event: RelationCreatedEvent,
): ProjectContactsDraft {
  if (event.kind === 'contact' && event.intent === 'project-main-contact') {
    const additionalContactIds = draft.additionalContactIds.filter(
      (id) => id !== event.id && id !== draft.contactId,
    );
    const additionalContactLabels = { ...draft.additionalContactLabels };
    delete additionalContactLabels[event.id];
    delete additionalContactLabels[draft.contactId];
    return {
      ...draft,
      contactId: event.id,
      contactLabel: event.label,
      additionalContactIds,
      additionalContactLabels,
    };
  }
  if (event.kind === 'contact' && event.intent === 'project-additional-contact') {
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
  if (event.kind === 'company' && event.intent === 'project-company') {
    return { ...draft, companyId: event.id, companyLabel: event.label };
  }
  return draft;
}
