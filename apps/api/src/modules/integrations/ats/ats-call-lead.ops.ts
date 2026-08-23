import type { TransactionClient } from '@nbos/database';
import { ATS_LEAD_SOURCE, ATS_LEAD_SOURCE_DETAIL } from './ats.constants';

export function atsLeadDisplayName(e164: string): string {
  return `Incoming call ${e164}`;
}

export async function createAtsLead(
  tx: TransactionClient,
  e164: string,
  contactId: string | null,
  code: string,
): Promise<string> {
  const contactName = atsLeadDisplayName(e164);
  const lead = await tx.lead.create({
    data: {
      code,
      name: contactName,
      contactName,
      phone: e164,
      source: ATS_LEAD_SOURCE,
      sourceDetail: ATS_LEAD_SOURCE_DETAIL,
      ...(contactId ? { contactId } : {}),
    },
    select: { id: true },
  });
  return lead.id;
}
