export interface CreateLeadDefaultsInput {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  source?: string | null;
  sourceDetail?: string | null;
  sourcePartnerId?: string | null;
  sourceContactId?: string | null;
  marketingAccountId?: string | null;
  marketingActivityId?: string | null;
  assignedTo?: string;
  notes?: string;
}

/**
 * Manual quick-create: default Seller (assignedTo) to the authenticated employee.
 */
export function resolveLeadCreateDefaults(
  data: CreateLeadDefaultsInput,
  meta: { actorId?: string },
): CreateLeadDefaultsInput {
  const assignedTo = data.assignedTo?.trim() || meta.actorId?.trim();
  return assignedTo ? { ...data, assignedTo } : data;
}
