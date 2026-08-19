const FALLBACK_CONTACT_FIRST_NAME = 'Contact';

export function personNameFromLead(lead: { contactName: string; name: string | null }): {
  firstName: string;
  lastName: string;
} {
  const raw = lead.contactName.trim() || lead.name?.trim() || FALLBACK_CONTACT_FIRST_NAME;
  const parts = raw.split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? FALLBACK_CONTACT_FIRST_NAME;
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}
