import { vi } from 'vitest';
import type { AtsWebhookPayload } from './ats.types';

export interface AtsIngestLeadRow {
  id: string;
  phone: string | null;
  status: string;
  trashedAt: Date | null;
  mergedIntoId: string | null;
  code: string;
  contactId: string | null;
  assignedTo: string | null;
}

export interface AtsIngestEventRow {
  id: string;
  uid: string;
  leadId: string | null;
  contactId: string | null;
  dealId: string | null;
  phone: string | null;
  calldirect: string | null;
  state: string | null;
  clid: string | null;
  billsec: string | null;
  source: string | null;
  initiatedByEmployeeId: string | null;
  createdAt: Date;
  responsibleEmployeeId: string | null;
  answeredEmployeeId: string | null;
}

export interface AtsIngestTestState {
  events: Map<string, AtsIngestEventRow>;
  leads: AtsIngestLeadRow[];
  contacts: Array<{ id: string; phone: string | null; trashedAt: Date | null }>;
  deals: Array<{
    id: string;
    contactId: string | null;
    leadId: string | null;
    status: string;
    trashedAt: Date | null;
    sellerId: string | null;
  }>;
  employees: Array<{ id: string; sipId: string | null }>;
}

export function inboundStart(overrides: Partial<AtsWebhookPayload> = {}): AtsWebhookPayload {
  return {
    uid: 'uid-1',
    lid: null,
    state: 'start',
    calldirect: '0',
    clid: '+37499123456',
    input: '011710101',
    op: null,
    rate: null,
    billsec: null,
    disposition: null,
    channel: null,
    recordLink: null,
    ...overrides,
  };
}

export function outboundStart(overrides: Partial<AtsWebhookPayload> = {}): AtsWebhookPayload {
  return inboundStart({
    calldirect: '1',
    clid: '3103585',
    op: '3103585',
    input: '+37499123456',
    ...overrides,
  });
}

export function createAtsIngestPrismaMock() {
  const state: AtsIngestTestState = {
    events: new Map(),
    leads: [],
    contacts: [],
    deals: [],
    employees: [],
  };
  const prisma = {
    atsCallEvent: createEventMocks(state),
    lead: createLeadMocks(state),
    contact: createContactMocks(state),
    deal: createDealMocks(state),
    employee: createEmployeeMocks(state),
    $queryRaw: vi.fn().mockResolvedValue([{ next_value: 1 }]),
    $transaction: vi
      .fn()
      .mockImplementation(async (callback: (tx: unknown) => Promise<string>) => callback(prisma)),
  };
  wrapLeadFindFirst(prisma.lead, state);
  return { prisma, state };
}

function createEventMocks(state: AtsIngestTestState) {
  return {
    findUnique: vi
      .fn()
      .mockImplementation(async ({ where }: { where: { uid?: string; id?: string } }) => {
        if (where.uid) return state.events.get(where.uid) ?? null;
        if (where.id) {
          return [...state.events.values()].find((row) => row.id === where.id) ?? null;
        }
        return null;
      }),
    create: vi
      .fn()
      .mockImplementation(
        async ({ data }: { data: Partial<AtsIngestEventRow> & { uid: string } }) => {
          if (state.events.has(data.uid)) {
            throw prismaUniqueUidError();
          }
          const row: AtsIngestEventRow = {
            id: `evt-${state.events.size + 1}`,
            uid: data.uid,
            leadId: data.leadId ?? null,
            contactId: data.contactId ?? null,
            dealId: data.dealId ?? null,
            phone: data.phone ?? null,
            calldirect: data.calldirect ?? null,
            state: data.state ?? null,
            clid: data.clid ?? null,
            billsec: data.billsec ?? null,
            source: data.source ?? null,
            initiatedByEmployeeId: data.initiatedByEmployeeId ?? null,
            createdAt: data.createdAt ?? new Date(),
            responsibleEmployeeId: data.responsibleEmployeeId ?? null,
            answeredEmployeeId: data.answeredEmployeeId ?? null,
          };
          state.events.set(data.uid, row);
          return row;
        },
      ),
    updateMany: vi.fn().mockImplementation(async ({ where, data }: EventUpdateManyArgs) => {
      const matches = [...state.events.values()].filter((row) =>
        matchesUpdateManyWhere(row, where),
      );
      for (const row of matches) {
        applyEventPatch(state, row, data);
      }
      return { count: matches.length };
    }),
    update: vi
      .fn()
      .mockImplementation(
        async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          const row = [...state.events.values()].find((item) => item.id === where.id);
          if (!row) throw new Error('missing event');
          applyEventPatch(state, row, data);
          return row;
        },
      ),
    findFirst: vi.fn().mockImplementation(async ({ where }: { where: EventFindWhere }) => {
      const matches = [...state.events.values()].filter((row) => matchesEventWhere(row, where));
      return (
        matches.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0] ??
        null
      );
    }),
    findMany: vi.fn(),
    count: vi.fn(),
  };
}

function createLeadMocks(state: AtsIngestTestState) {
  return {
    findFirst: vi.fn().mockImplementation(async ({ where }: { where: LeadPhoneWhere }) => {
      const phones = where.phone?.in ?? [];
      const excluded = new Set(
        where.status?.notIn ?? (where.status?.not ? [where.status.not] : []),
      );
      return (
        state.leads.find(
          (lead) =>
            lead.trashedAt == null &&
            lead.mergedIntoId == null &&
            !excluded.has(lead.status) &&
            lead.phone != null &&
            phones.includes(lead.phone),
        ) ?? null
      );
    }),
    findUnique: vi.fn().mockImplementation(async ({ where }: { where: { id: string } }) => {
      const row = state.leads.find((lead) => lead.id === where.id);
      return row ? { assignedTo: row.assignedTo } : null;
    }),
    create: vi.fn().mockImplementation(
      async ({
        data,
      }: {
        data: {
          code: string;
          phone: string;
          contactName: string;
          contactId?: string;
          assignedTo?: string | null;
        };
      }) => {
        const row: AtsIngestLeadRow = {
          id: `lead-${state.leads.length + 1}`,
          phone: data.phone,
          status: 'NEW',
          trashedAt: null,
          mergedIntoId: null,
          code: data.code,
          contactId: data.contactId ?? null,
          assignedTo: data.assignedTo ?? null,
        };
        state.leads.push(row);
        return { id: row.id };
      },
    ),
  };
}

function phonesFromContactWhere(where: ContactFindWhere): string[] {
  const fromPhone = where.phone?.in ?? [];
  const fromOr = (where.OR ?? []).flatMap((clause) => [
    ...(clause.phone?.in ?? []),
    ...(clause.extraPhones?.some?.e164?.in ?? []),
  ]);
  return [...fromPhone, ...fromOr];
}

function createContactMocks(state: AtsIngestTestState) {
  return {
    findFirst: vi.fn().mockImplementation(async ({ where }: { where: ContactFindWhere }) => {
      const phones = phonesFromContactWhere(where);
      return (
        state.contacts.find(
          (contact) =>
            contact.trashedAt == null && contact.phone != null && phones.includes(contact.phone),
        ) ?? null
      );
    }),
  };
}

function createDealMocks(state: AtsIngestTestState) {
  return {
    findFirst: vi.fn().mockImplementation(async ({ where }: { where: DealFindWhere }) => {
      const excluded = new Set(where.status?.notIn ?? []);
      return (
        state.deals.find((deal) => {
          if (deal.trashedAt != null) return false;
          if (excluded.has(deal.status)) return false;
          if (where.contactId && deal.contactId !== where.contactId) return false;
          if (where.leadId && deal.leadId !== where.leadId) return false;
          return true;
        }) ?? null
      );
    }),
    findUnique: vi.fn().mockImplementation(async ({ where }: { where: { id: string } }) => {
      const row = state.deals.find((deal) => deal.id === where.id);
      return row ? { sellerId: row.sellerId } : null;
    }),
  };
}

function createEmployeeMocks(state: AtsIngestTestState) {
  return {
    findFirst: vi.fn().mockImplementation(async ({ where }: { where: { sipId?: string } }) => {
      return state.employees.find((employee) => employee.sipId === where.sipId) ?? null;
    }),
  };
}

function wrapLeadFindFirst(
  lead: { findFirst: ReturnType<typeof vi.fn> },
  state: AtsIngestTestState,
): void {
  const byPhone = lead.findFirst as (args: unknown) => Promise<unknown>;
  lead.findFirst = vi.fn().mockImplementation(async (args: unknown) => {
    const typed = args as { where?: LeadFindWhere };
    if (typed.where?.code?.startsWith) {
      const prefix = typed.where.code.startsWith;
      const matches = state.leads.filter((row) => row.code.startsWith(prefix));
      const last = matches.sort((a, b) => b.code.localeCompare(a.code))[0];
      return last ? { code: last.code } : null;
    }
    const contactId =
      typed.where?.contactId ?? typed.where?.OR?.find((item) => item.contactId)?.contactId;
    if (contactId) {
      const excluded = new Set(typed.where?.status?.notIn ?? []);
      const found = state.leads.find(
        (row) =>
          row.contactId === contactId &&
          row.trashedAt == null &&
          row.mergedIntoId == null &&
          !excluded.has(row.status),
      );
      return found ? { id: found.id } : null;
    }
    return byPhone(args);
  });
}

interface ContactFindWhere {
  phone?: { in: string[] };
  OR?: Array<{
    phone?: { in: string[] };
    extraPhones?: { some?: { e164?: { in: string[] } } };
  }>;
}

interface LeadPhoneWhere {
  phone?: { in: string[] };
  status?: { not: string; notIn?: string[] };
}

interface LeadFindWhere {
  code?: { startsWith: string };
  contactId?: string;
  OR?: Array<{ contactId?: string }>;
  status?: { notIn?: string[] };
}

interface DealFindWhere {
  contactId?: string;
  leadId?: string;
  status?: { notIn?: string[] };
}

interface EventFindWhere {
  source?: string;
  state?: string;
  phone?: string;
  calldirect?: string;
  initiatedByEmployeeId?: string;
  createdAt?: { gte?: Date };
}

interface EventUpdateManyArgs {
  where: {
    id?: string;
    uid?: string;
    OR?: Array<{ state?: { in?: string[] } | null; NOT?: { state?: { in?: string[] } } }>;
  };
  data: Record<string, unknown>;
}

function prismaUniqueUidError(): { code: string; meta: { target: string[] } } {
  return { code: 'P2002', meta: { target: ['uid'] } };
}

function applyEventPatch(
  state: AtsIngestTestState,
  row: AtsIngestEventRow,
  data: Record<string, unknown>,
): void {
  const previousUid = row.uid;
  Object.assign(row, data);
  if (row.uid !== previousUid) {
    state.events.delete(previousUid);
    state.events.set(row.uid, row);
  }
}

function matchesUpdateManyWhere(
  row: AtsIngestEventRow,
  where: EventUpdateManyArgs['where'],
): boolean {
  if (where.id && row.id !== where.id) return false;
  if (where.uid && row.uid !== where.uid) return false;
  if (!where.OR?.length) return true;
  return where.OR.some((clause) => matchesStateClause(row.state, clause));
}

function matchesStateClause(
  state: string | null,
  clause: { state?: { in?: string[] } | null; NOT?: { state?: { in?: string[] } } },
): boolean {
  if (clause.state === null) return state == null;
  if (clause.state?.in) return state != null && clause.state.in.includes(state);
  if (clause.NOT?.state?.in) return state == null || !clause.NOT.state.in.includes(state);
  return false;
}

function matchesEventWhere(row: AtsIngestEventRow, where: EventFindWhere): boolean {
  if (where.source && row.source !== where.source) return false;
  if (where.state && row.state !== where.state) return false;
  if (where.phone && row.phone !== where.phone) return false;
  if (where.calldirect && row.calldirect !== where.calldirect) return false;
  if (where.initiatedByEmployeeId && row.initiatedByEmployeeId !== where.initiatedByEmployeeId) {
    return false;
  }
  if (where.createdAt?.gte && row.createdAt < where.createdAt.gte) return false;
  return true;
}
