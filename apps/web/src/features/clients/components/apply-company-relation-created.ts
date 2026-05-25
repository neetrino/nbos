import type { RelationCreatedEvent } from '@/components/shared/relation-picker';
import type { CompanyGeneralDraft } from './company-general-form-state';

type CompanyFormContacts = Pick<
  CompanyGeneralDraft,
  'primaryContactId' | 'primaryContactLabel' | 'billingContactId' | 'billingContactLabel'
>;

/** Applies relation create events onto company sheet or create-dialog contact fields. */
export function applyCompanyRelationCreated(
  draft: CompanyFormContacts,
  event: RelationCreatedEvent,
): CompanyFormContacts {
  if (event.kind !== 'contact') return draft;
  if (event.intent === 'company-sheet-billing') {
    return { ...draft, billingContactId: event.id, billingContactLabel: event.label };
  }
  if (event.intent === 'company-sheet-primary' || event.intent === 'company-create-primary') {
    return { ...draft, primaryContactId: event.id, primaryContactLabel: event.label };
  }
  if (event.intent === 'company-create-billing') {
    return { ...draft, billingContactId: event.id, billingContactLabel: event.label };
  }
  return draft;
}
