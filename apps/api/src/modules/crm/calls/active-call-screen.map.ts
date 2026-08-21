import { mapCallDirection, parseDurationSec } from './call-response.map';
import { mapAtsStateToPhase } from '../../integrations/ats/ats-call-realtime.phase';
import { formatPersonName } from '../../integrations/ats/ats-call-realtime.target';

export type ActiveCallScreenSnapshot = {
  callId: string;
  uid: string;
  direction: 'INBOUND' | 'OUTBOUND' | null;
  phase: 'ringing' | 'answered' | 'ended';
  phone: string | null;
  displayName: string | null;
  contact: {
    id: string | null;
    name: string | null;
    companyName: string | null;
    phones: string[];
  };
  deal: {
    id: string | null;
    name: string | null;
    stage: string | null;
    amount: string | null;
  };
  projectName: string | null;
  productName: string | null;
  leadId: string | null;
  leadName: string | null;
  durationSec: number | null;
  disposition: string | null;
  note: string | null;
  recordingStatus: 'PENDING' | 'DOWNLOADING' | 'READY' | 'FAILED' | null;
  recentCalls: Array<{
    id: string;
    direction: 'INBOUND' | 'OUTBOUND' | null;
    phase: 'ringing' | 'answered' | 'ended';
    createdAt: Date;
    durationSec: number | null;
  }>;
};

type ScreenRow = {
  id: string;
  uid: string;
  calldirect: string | null;
  state: string | null;
  phone: string | null;
  clid: string | null;
  billsec: string | null;
  disposition: string | null;
  note: string | null;
  recordingStatus: 'PENDING' | 'DOWNLOADING' | 'READY' | 'FAILED' | null;
  leadId: string | null;
  contactId: string | null;
  dealId: string | null;
  lead: { name: string | null; contactName: string } | null;
  contact: {
    firstName: string;
    lastName: string;
    phone: string | null;
    extraPhones: Array<{ e164: string }>;
    companies: Array<{ name: string }>;
  } | null;
  deal: {
    name: string | null;
    code: string;
    status: string;
    amount: { toString(): string } | null;
    projectId: string | null;
    existingProduct: { name: string } | null;
  } | null;
};

export function mapActiveCallScreen(
  row: ScreenRow,
  extras: {
    projectName: string | null;
    productName: string | null;
    recentCalls: ActiveCallScreenSnapshot['recentCalls'];
  },
): ActiveCallScreenSnapshot {
  const contactName = formatPersonName(row.contact);
  const leadName = row.lead?.name?.trim() || row.lead?.contactName?.trim() || null;
  const phone = row.phone ?? row.clid;
  const phones = uniquePhones([
    row.contact?.phone ?? null,
    ...(row.contact?.extraPhones.map((item) => item.e164) ?? []),
    phone,
  ]);
  return {
    callId: row.id,
    uid: row.uid,
    direction: mapCallDirection(row.calldirect),
    phase: mapAtsStateToPhase(row.state),
    phone,
    displayName: contactName || leadName || phone,
    contact: {
      id: row.contactId,
      name: contactName,
      companyName: row.contact?.companies[0]?.name ?? null,
      phones,
    },
    deal: {
      id: row.dealId,
      name: row.deal?.name?.trim() || row.deal?.code?.trim() || null,
      stage: row.deal?.status ?? null,
      amount: row.deal?.amount != null ? row.deal.amount.toString() : null,
    },
    projectName: extras.projectName,
    productName: extras.productName,
    leadId: row.leadId,
    leadName,
    durationSec: parseDurationSec(row.billsec),
    disposition: row.disposition,
    note: row.note,
    recordingStatus: row.recordingStatus,
    recentCalls: extras.recentCalls,
  };
}

function uniquePhones(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim() ?? '';
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}
