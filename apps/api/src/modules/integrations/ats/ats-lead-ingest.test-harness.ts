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
}

export interface AtsIngestTestState {
  events: Map<
    string,
    {
      id: string;
      uid: string;
      leadId: string | null;
      calldirect: string | null;
      state: string | null;
      clid: string | null;
    }
  >;
  leads: AtsIngestLeadRow[];
  contacts: Array<{ id: string; phone: string | null; trashedAt: Date | null }>;
  deals: Array<{
    id: string;
    contactId: string | null;
    leadId: string | null;
    status: string;
    trashedAt: Date | null;
  }>;
}

export function inboundStart(overrides: Partial<AtsWebhookPayload> = {}): AtsWebhookPayload {
  return {
    uid: 'uid-1',
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

export function createAtsIngestPrismaMock() {
  const state: AtsIngestTestState = {
    events: new Map(),
    leads: [],
    contacts: [],
    deals: [],
  };
  const prisma = {
    atsCallEvent: createEventMocks(state),
    lead: createLeadMocks(state),
    contact: createContactMocks(state),
    deal: createDealMocks(state),
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
    findUnique: vi.fn().mockImplementation(async ({ where }: { where: { uid: string } }) => {
      return state.events.get(where.uid) ?? null;
    }),
    create: vi.fn().mockImplementation(
      async ({
        data,
      }: {
        data: {
          uid: string;
          calldirect?: string | null;
          state?: string | null;
          clid?: string | null;
        };
      }) => {
        const row = {
          id: `evt-${state.events.size + 1}`,
          uid: data.uid,
          leadId: null as string | null,
          calldirect: data.calldirect ?? null,
          state: data.state ?? null,
          clid: data.clid ?? null,
        };
        state.events.set(data.uid, row);
        return row;
      },
    ),
    update: vi
      .fn()
      .mockImplementation(
        async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          const row = [...state.events.values()].find((item) => item.id === where.id);
          if (!row) throw new Error('missing event');
          Object.assign(row, data);
          return row;
        },
      ),
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
    create: vi
      .fn()
      .mockImplementation(
        async ({
          data,
        }: {
          data: { code: string; phone: string; contactName: string; contactId?: string };
        }) => {
          const row: AtsIngestLeadRow = {
            id: `lead-${state.leads.length + 1}`,
            phone: data.phone,
            status: 'NEW',
            trashedAt: null,
            mergedIntoId: null,
            code: data.code,
            contactId: data.contactId ?? null,
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
    findFirst: vi
      .fn()
      .mockImplementation(
        async ({ where }: { where: { contactId?: string; status?: { notIn?: string[] } } }) => {
          const excluded = new Set(where.status?.notIn ?? []);
          return (
            state.deals.find(
              (deal) =>
                deal.trashedAt == null &&
                deal.contactId === where.contactId &&
                !excluded.has(deal.status),
            ) ?? null
          );
        },
      ),
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
