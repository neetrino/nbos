import type { RelationCreatedEvent } from '@/components/shared/relation-picker';
import type { CompanyGeneralDraft } from './company-general-form-state';

type CompanyFormContacts = Pick<
  CompanyGeneralDraft,
  'contactIds' | 'contactLabels' | 'billingContactId' | 'billingContactLabel'
>;

/** Applies relation create events onto company sheet or create-dialog contact fields. */
export function applyCompanyRelationCreated(
  draft: CompanyFormContacts,
  event: RelationCreatedEvent,
): CompanyFormContacts {
  if (event.kind !== 'contact') return draft;
  if (event.intent === 'company-sheet-billing' || event.intent === 'company-create-billing') {
    return { ...draft, billingContactId: event.id, billingContactLabel: event.label };
  }
  if (event.intent === 'company-contacts' || event.intent === 'company-create-contacts') {
    if (draft.contactIds.includes(event.id)) return draft;
    return {
      ...draft,
      contactIds: [...draft.contactIds, event.id],
      contactLabels: { ...draft.contactLabels, [event.id]: event.label },
    };
  }
  return draft;
}
