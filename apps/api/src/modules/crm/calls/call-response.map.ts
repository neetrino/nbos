import {
  ATS_CALLDIRECT_INBOUND,
  ATS_CALLDIRECT_OUTBOUND,
} from '../../integrations/ats/ats.constants';

export type CallDirection = 'INBOUND' | 'OUTBOUND';

export interface CallResponse {
  id: string;
  uid: string;
  direction: CallDirection | null;
  phone: string | null;
  status: string | null;
  durationSec: number | null;
  disposition: string | null;
  rate: string | null;
  leadId: string | null;
  contactId: string | null;
  dealId: string | null;
  responsibleEmployeeId: string | null;
  answeredEmployeeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CallRecord {
  id: string;
  uid: string;
  calldirect: string | null;
  phone: string | null;
  clid: string | null;
  state: string | null;
  billsec: string | null;
  disposition: string | null;
  rate: string | null;
  leadId: string | null;
  contactId: string | null;
  dealId: string | null;
  responsibleEmployeeId: string | null;
  answeredEmployeeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function mapCallResponse(row: CallRecord): CallResponse {
  return {
    id: row.id,
    uid: row.uid,
    direction: mapCallDirection(row.calldirect),
    phone: row.phone ?? row.clid,
    status: row.state,
    durationSec: parseDurationSec(row.billsec),
    disposition: row.disposition,
    rate: row.rate,
    leadId: row.leadId,
    contactId: row.contactId,
    dealId: row.dealId,
    responsibleEmployeeId: row.responsibleEmployeeId,
    answeredEmployeeId: row.answeredEmployeeId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapCallDirection(calldirect: string | null): CallDirection | null {
  if (calldirect === ATS_CALLDIRECT_INBOUND) return 'INBOUND';
  if (calldirect === ATS_CALLDIRECT_OUTBOUND) return 'OUTBOUND';
  return null;
}

export function parseDurationSec(billsec: string | null): number | null {
  if (billsec == null || billsec.trim() === '') return null;
  const parsed = Number.parseInt(billsec, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}
