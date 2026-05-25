import type { RelationCreatedEvent } from '@/components/shared/relation-picker';

type ProjectHubCreateDraft = {
  contactId: string;
  contactLabel: string;
  companyId: string;
  companyLabel: string;
};

/** Applies inline create from project hub dialog onto local picker state. */
export function applyProjectHubRelationCreated(
  draft: ProjectHubCreateDraft,
  event: RelationCreatedEvent,
): ProjectHubCreateDraft {
  if (event.intent !== 'project-hub-create') return draft;
  if (event.kind === 'contact') {
    return { ...draft, contactId: event.id, contactLabel: event.label };
  }
  if (event.kind === 'company') {
    return { ...draft, companyId: event.id, companyLabel: event.label };
  }
  return draft;
}
