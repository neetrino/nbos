import type { TransactionClient } from '@nbos/database';
import { ATS_LEAD_SOURCE, ATS_LEAD_SOURCE_DETAIL } from './ats.constants';

export function atsLeadDisplayName(e164: string, outbound = false): string {
  return outbound ? `Outgoing call ${e164}` : `Incoming call ${e164}`;
}

export async function createAtsLead(
  tx: TransactionClient,
  input: {
    e164: string;
    contactId: string | null;
    code: string;
    assignedTo?: string | null;
    outbound?: boolean;
  },
): Promise<string> {
  const contactName = atsLeadDisplayName(input.e164, input.outbound === true);
  const lead = await tx.lead.create({
    data: {
      code: input.code,
      name: contactName,
      contactName,
      phone: input.e164,
      source: ATS_LEAD_SOURCE,
      sourceDetail: ATS_LEAD_SOURCE_DETAIL,
      ...(input.contactId ? { contactId: input.contactId } : {}),
      ...(input.assignedTo ? { assignedTo: input.assignedTo } : {}),
    },
    select: { id: true },
  });
  return lead.id;
}
