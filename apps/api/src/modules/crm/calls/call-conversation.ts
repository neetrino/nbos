import { mapAtsStateToPhase } from '../../integrations/ats/ats-call-realtime.phase';
import { parseDurationSec, type CallRecord } from './call-response.map';

const ANSWERED_DISPOSITION = 'ANSWERED';
const CUSTOMER_SCORE_CONTACT = 4;
const CUSTOMER_SCORE_LEAD = 2;
const CUSTOMER_SCORE_DEAL = 1;
const CUSTOMER_SCORE_PHONE = 1;
const EMPLOYEE_RANK_ANSWERED = 3;
const EMPLOYEE_RANK_INITIATED = 2;
const EMPLOYEE_RANK_RESPONSIBLE = 1;

export type CallConversationRow = CallRecord & {
  lid?: string | null;
  initiatedByEmployeeId?: string | null;
};

type ConversationLeg = {
  id: string;
  lid?: string | null;
  createdAt: Date;
  state: string | null;
  billsec?: string | null;
  disposition?: string | null;
  answeredEmployeeId?: string | null;
};

export function normalizeCallLid(lid: string | null | undefined): string | null {
  if (typeof lid !== 'string') return null;
  const trimmed = lid.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function callConversationKey(row: { id: string; lid?: string | null }): string {
  const lid = normalizeCallLid(row.lid);
  return lid ? `lid:${lid}` : `id:${row.id}`;
}

export function conversationAnchor<T extends { id: string; createdAt: Date }>(
  legs: readonly T[],
): T | null {
  const first = legs[0];
  if (!first) return null;
  if (legs.length === 1) return first;
  let best = first;
  for (const leg of legs) {
    if (compareConnectionStart(leg, best) < 0) best = leg;
  }
  return best;
}

export function conversationPhase(
  legs: ReadonlyArray<{ state: string | null }>,
): 'ringing' | 'answered' | 'ended' {
  let answered = false;
  let live = false;
  for (const leg of legs) {
    const phase = mapAtsStateToPhase(leg.state);
    if (phase === 'ended') continue;
    live = true;
    if (phase === 'answered') answered = true;
  }
  if (!live) return 'ended';
  return answered ? 'answered' : 'ringing';
}

export function conversationStatus(legs: readonly ConversationLeg[]): string | null {
  const live = legs.filter((leg) => mapAtsStateToPhase(leg.state) !== 'ended');
  if (live.length > 0) return liveAnsweredState(live);
  const answered = [...legs].reverse().find(isAnsweredLeg);
  if (answered?.state) return answered.state;
  return legs.find((leg) => leg.state)?.state ?? null;
}

export function conversationDurationSec(
  legs: ReadonlyArray<{ billsec?: string | null }>,
): number | null {
  let max: number | null = null;
  for (const leg of legs) {
    const parsed = parseDurationSec(leg.billsec ?? null);
    if (parsed == null) continue;
    if (max == null || parsed > max) max = parsed;
  }
  return max;
}
export function groupCallConversations<
  T extends { id: string; lid?: string | null; createdAt: Date },
>(rows: readonly T[]): T[][] {
  const buckets = new Map<string, T[]>();
  for (const row of rows) {
    const key = callConversationKey(row);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(row);
    else buckets.set(key, [row]);
  }
  return [...buckets.values()].sort(compareGroupsDesc);
}

export function pageConversationGroups<T>(
  groups: readonly T[][],
  page: number,
  pageSize: number,
): { groups: T[][]; total: number; totalPages: number } {
  const total = groups.length;
  const start = (page - 1) * pageSize;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  return { groups: groups.slice(start, start + pageSize), total, totalPages };
}

export function mergeCallConversation<T extends CallConversationRow>(rows: readonly T[]): T {
  const ordered = [...rows].sort(compareConnectionStart);
  const anchor = ordered[0];
  if (!anchor) throw new Error('Cannot merge an empty call conversation');
  if (ordered.length === 1) return anchor;
  return composeConversation(anchor, ordered);
}

function composeConversation<T extends CallConversationRow>(anchor: T, ordered: readonly T[]): T {
  const customer = fillCustomer(ordered);
  const employees = fillEmployees(ordered);
  const duration = conversationDurationSec(ordered);
  return {
    ...anchor,
    ...customerFields(anchor, customer),
    ...employees,
    calldirect: customer.calldirect ?? anchor.calldirect,
    state: conversationStatus(ordered),
    billsec: duration == null ? anchor.billsec : String(duration),
    disposition: fillDisposition(ordered) ?? anchor.disposition,
    rate: fillRate(ordered) ?? anchor.rate,
    note: fillNote(ordered),
    updatedAt: latestUpdate(ordered),
    id: anchor.id,
    uid: anchor.uid,
    createdAt: anchor.createdAt,
    recordingStatus: anchor.recordingStatus,
  };
}

function customerFields(anchor: CallConversationRow, customer: CustomerSlice) {
  return {
    leadId: customer.leadId ?? anchor.leadId,
    contactId: customer.contactId ?? anchor.contactId,
    dealId: customer.dealId ?? anchor.dealId,
    lead: customer.lead ?? anchor.lead,
    contact: customer.contact ?? anchor.contact,
    deal: customer.deal ?? anchor.deal,
    phone: customer.phone ?? anchor.phone,
    clid: customer.clid ?? anchor.clid,
  };
}

function liveAnsweredState(live: readonly ConversationLeg[]): string | null {
  const answered = live.find((leg) => mapAtsStateToPhase(leg.state) === 'answered');
  return (answered ?? live[0])?.state ?? null;
}

function isAnsweredLeg(leg: ConversationLeg): boolean {
  return leg.disposition === ANSWERED_DISPOSITION || Boolean(leg.answeredEmployeeId);
}

function compareConnectionStart(
  left: { id: string; createdAt: Date },
  right: { id: string; createdAt: Date },
): number {
  const delta = left.createdAt.getTime() - right.createdAt.getTime();
  if (delta !== 0) return delta;
  return left.id.localeCompare(right.id);
}

function compareGroupsDesc<T extends { id: string; createdAt: Date }>(
  left: T[],
  right: T[],
): number {
  const a = conversationAnchor(left);
  const b = conversationAnchor(right);
  if (!a || !b) return 0;
  const delta = b.createdAt.getTime() - a.createdAt.getTime();
  if (delta !== 0) return delta;
  return b.id.localeCompare(a.id);
}

type CustomerSlice = {
  leadId: string | null;
  contactId: string | null;
  dealId: string | null;
  lead: CallConversationRow['lead'];
  contact: CallConversationRow['contact'];
  deal: CallConversationRow['deal'];
  phone: string | null;
  clid: string | null;
  calldirect: string | null;
};

function fillCustomer(rows: readonly CallConversationRow[]): CustomerSlice {
  const ranked = [...rows].sort(compareCustomer);
  const filled = emptyCustomer();
  for (const row of ranked) assignCustomer(filled, row);
  return filled;
}

function compareCustomer(left: CallConversationRow, right: CallConversationRow): number {
  const score = customerScore(right) - customerScore(left);
  if (score !== 0) return score;
  return compareConnectionStart(left, right);
}

function customerScore(row: CallConversationRow): number {
  const contact = row.contactId ? CUSTOMER_SCORE_CONTACT : 0;
  const lead = row.leadId ? CUSTOMER_SCORE_LEAD : 0;
  const deal = row.dealId ? CUSTOMER_SCORE_DEAL : 0;
  const phone = row.phone || row.clid ? CUSTOMER_SCORE_PHONE : 0;
  return contact + lead + deal + phone;
}

function emptyCustomer(): CustomerSlice {
  return {
    leadId: null,
    contactId: null,
    dealId: null,
    lead: null,
    contact: null,
    deal: null,
    phone: null,
    clid: null,
    calldirect: null,
  };
}

function assignCustomer(filled: CustomerSlice, row: CallConversationRow): void {
  if (!filled.contactId && row.contactId) {
    filled.contactId = row.contactId;
    filled.contact = row.contact ?? null;
  }
  if (!filled.leadId && row.leadId) {
    filled.leadId = row.leadId;
    filled.lead = row.lead ?? null;
  }
  if (!filled.dealId && row.dealId) {
    filled.dealId = row.dealId;
    filled.deal = row.deal ?? null;
  }
  if (!filled.phone && row.phone) filled.phone = row.phone;
  if (!filled.clid && row.clid) filled.clid = row.clid;
  if (!filled.calldirect && row.calldirect) filled.calldirect = row.calldirect;
}

function fillEmployees(rows: readonly CallConversationRow[]) {
  const answered = latestWhere(rows, (row) => row.answeredEmployeeId != null);
  const initiated = latestWhere(rows, (row) => row.initiatedByEmployeeId != null);
  const responsible = latestWhere(rows, (row) => row.responsibleEmployeeId != null);
  return {
    answeredEmployeeId: answered?.answeredEmployeeId ?? null,
    answeredEmployee: answered?.answeredEmployee ?? null,
    initiatedByEmployeeId: initiated?.initiatedByEmployeeId ?? null,
    initiatedByEmployee: initiated?.initiatedByEmployee ?? null,
    responsibleEmployeeId: responsible?.responsibleEmployeeId ?? null,
    responsibleEmployee: responsible?.responsibleEmployee ?? null,
  };
}

function latestWhere(
  rows: readonly CallConversationRow[],
  predicate: (row: CallConversationRow) => boolean,
): CallConversationRow | null {
  let found: CallConversationRow | null = null;
  for (const row of rows) {
    if (!predicate(row)) continue;
    if (!found || compareConnectionStart(found, row) < 0) found = row;
  }
  return found;
}

function fillDisposition(rows: readonly CallConversationRow[]): string | null {
  if (rows.some((row) => row.disposition === ANSWERED_DISPOSITION)) return ANSWERED_DISPOSITION;
  return rows.find((row) => row.disposition)?.disposition ?? null;
}
function fillRate(rows: readonly CallConversationRow[]): string | null {
  return rows.find((row) => row.rate)?.rate ?? null;
}
function fillNote(rows: readonly CallConversationRow[]): string | null {
  const ranked = [...rows].sort((left, right) => employeeRank(right) - employeeRank(left));
  for (const row of ranked) {
    if (row.note?.trim()) return row.note ?? null;
  }
  return null;
}
function employeeRank(row: CallConversationRow): number {
  if (row.answeredEmployeeId) return EMPLOYEE_RANK_ANSWERED;
  if (row.initiatedByEmployeeId) return EMPLOYEE_RANK_INITIATED;
  if (row.responsibleEmployeeId) return EMPLOYEE_RANK_RESPONSIBLE;
  return 0;
}
function latestUpdate(rows: readonly CallConversationRow[]): Date {
  let latest = rows[0]?.updatedAt ?? new Date(0);
  for (const row of rows) {
    if (row.updatedAt.getTime() > latest.getTime()) latest = row.updatedAt;
  }
  return latest;
}
