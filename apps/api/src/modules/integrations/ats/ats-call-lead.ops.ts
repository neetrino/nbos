import type { TransactionClient } from '@nbos/database';
import { ATS_LEAD_SOURCE, ATS_LEAD_SOURCE_DETAIL } from './ats.constants';

export function atsLeadDisplayName(e164: string): string {
  return `Incoming call ${e164}`;
}

export async function createAtsLead(
  tx: TransactionClient,
  e164: string,
  contactId: string | null,
): Promise<string> {
  const contactName = atsLeadDisplayName(e164);
  const lead = await tx.lead.create({
    data: {
      code: await generateLeadCode(tx),
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

async function generateLeadCode(tx: TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const lastLead = await tx.lead.findFirst({
    where: { code: { startsWith: `L-${year}-` } },
    orderBy: { code: 'desc' },
    select: { code: true },
  });
  const nextNum = lastLead ? parseInt(lastLead.code.split('-')[2] ?? '0', 10) + 1 : 1;
  return `L-${year}-${String(nextNum).padStart(4, '0')}`;
}
