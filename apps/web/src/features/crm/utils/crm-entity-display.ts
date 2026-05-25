import type { Deal } from '@/lib/api/deals';
import type { Lead } from '@/lib/api/leads';

/** Primary kanban / sheet title — inquiry or deal name, not contact. */
export function getDealDisplayTitle(deal: Pick<Deal, 'name' | 'code'>): string {
  return deal.name?.trim() || deal.code;
}

export function getDealContactName(deal: Pick<Deal, 'contact'>): string | null {
  if (!deal.contact) return null;
  const name = `${deal.contact.firstName} ${deal.contact.lastName}`.trim();
  return name || null;
}

/** Secondary line on cards (contact, or company when no contact). */
export function getDealCardMetaLabel(deal: Pick<Deal, 'contact' | 'company'>): string | null {
  return getDealContactName(deal) ?? deal.company?.name ?? null;
}

export function getLeadDisplayTitle(lead: Pick<Lead, 'name' | 'code'>): string {
  return lead.name?.trim() || lead.code;
}

export function getLeadCardMetaLabel(
  lead: Pick<Lead, 'name' | 'contactName' | 'code'>,
): string | null {
  const title = getLeadDisplayTitle(lead);
  const contact = lead.contactName?.trim();
  if (contact && contact !== title) return contact;
  return null;
}
