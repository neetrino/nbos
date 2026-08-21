import {
  ATS_CALLDIRECT_INBOUND,
  ATS_CALLDIRECT_OUTBOUND,
} from '../../integrations/ats/ats.constants';
import { CRM_ACTIVITY_TYPE_CALL } from './calls.constants';

export type CallDirection = 'INBOUND' | 'OUTBOUND';
export type CallRecordingStatus = 'PENDING' | 'DOWNLOADING' | 'READY' | 'FAILED';

type PersonName = { firstName: string; lastName: string };

export interface CallResponse {
  type: typeof CRM_ACTIVITY_TYPE_CALL;
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
  contactName: string | null;
  leadName: string | null;
  dealName: string | null;
  employeeName: string | null;
  recordingStatus: CallRecordingStatus | null;
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
  recordingStatus: CallRecordingStatus | null;
  createdAt: Date;
  updatedAt: Date;
  lead?: { name: string | null; contactName: string } | null;
  contact?: PersonName | null;
  deal?: { name: string | null; code: string } | null;
  responsibleEmployee?: PersonName | null;
  answeredEmployee?: PersonName | null;
}

export function mapCallResponse(row: CallRecord): CallResponse {
  return {
    type: CRM_ACTIVITY_TYPE_CALL,
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
    contactName: formatPersonName(row.contact),
    leadName: row.lead?.name?.trim() || row.lead?.contactName?.trim() || null,
    dealName: row.deal?.name?.trim() || row.deal?.code?.trim() || null,
    employeeName:
      formatPersonName(row.answeredEmployee) ?? formatPersonName(row.responsibleEmployee),
    recordingStatus: row.recordingStatus,
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

function formatPersonName(person: PersonName | null | undefined): string | null {
  if (!person) return null;
  const name = `${person.firstName} ${person.lastName}`.trim();
  return name.length > 0 ? name : null;
}
