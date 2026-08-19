/** Hide free-text name/phone/email once a CRM Contact is linked. */
export function shouldHideLeadIdentityFields(params: {
  contactId?: string | null;
  contactIds?: string[];
}): boolean {
  if (params.contactId?.trim()) return true;
  return (params.contactIds?.length ?? 0) > 0;
}
