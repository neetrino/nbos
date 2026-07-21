import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AtsLeadIngestService } from './ats-lead-ingest.service';
import type { AtsWebhookPayload } from './ats.types';

function inboundStart(overrides: Partial<AtsWebhookPayload> = {}): AtsWebhookPayload {
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

function createPrismaMock() {
  const state = {
    events: new Map<
      string,
      {
        id: string;
        uid: string;
        leadId: string | null;
        calldirect: string | null;
        state: string | null;
        clid: string | null;
      }
    >(),
    leads: [] as Array<{
      id: string;
      phone: string | null;
      status: string;
      trashedAt: Date | null;
      code: string;
    }>,
  };

  const prisma = {
    atsCallEvent: {
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
            if (!row) {
              throw new Error('missing event');
            }
            Object.assign(row, data);
            return row;
          },
        ),
    },
    lead: {
      findFirst: vi.fn().mockImplementation(
        async ({
          where,
        }: {
          where: {
            phone?: { in: string[] };
            status?: { not: string };
            trashedAt?: null;
          };
        }) => {
          const phones = where.phone?.in ?? [];
          return (
            state.leads.find(
              (lead) =>
                lead.trashedAt == null &&
                lead.status !== 'SQL' &&
                lead.phone != null &&
                phones.includes(lead.phone),
            ) ?? null
          );
        },
      ),
      create: vi
        .fn()
        .mockImplementation(
          async ({ data }: { data: { code: string; phone: string; contactName: string } }) => {
            const row = {
              id: `lead-${state.leads.length + 1}`,
              phone: data.phone,
              status: 'NEW',
              trashedAt: null,
              code: data.code,
            };
            state.leads.push(row);
            return { id: row.id };
          },
        ),
      findFirstForCode: undefined as unknown,
    },
    $transaction: vi
      .fn()
      .mockImplementation(async (callback: (tx: typeof prisma) => Promise<string>) =>
        callback(prisma),
      ),
  };

  // Code generation uses lead.findFirst with code filter — share the same mock.
  const leadFindFirst = prisma.lead.findFirst;
  prisma.lead.findFirst = vi.fn().mockImplementation(async (args: unknown) => {
    const typed = args as {
      where?: { code?: { startsWith: string }; phone?: { in: string[] } };
      select?: { code?: true; id?: true };
    };
    if (typed.where?.code?.startsWith) {
      const prefix = typed.where.code.startsWith;
      const matches = state.leads.filter((lead) => lead.code.startsWith(prefix));
      const last = matches.sort((a, b) => b.code.localeCompare(a.code))[0];
      return last ? { code: last.code } : null;
    }
    return leadFindFirst(args as never);
  });

  return { prisma, state };
}

describe('AtsLeadIngestService', () => {
  let prisma: ReturnType<typeof createPrismaMock>['prisma'];
  let state: ReturnType<typeof createPrismaMock>['state'];
  let service: AtsLeadIngestService;

  beforeEach(() => {
    ({ prisma, state } = createPrismaMock());
    service = new AtsLeadIngestService(prisma as never);
  });

  it('creates a Lead for inbound start with new clid', async () => {
    await service.ingestCallEvent(inboundStart());

    expect(state.leads).toHaveLength(1);
    expect(state.leads[0]?.phone).toBe('+37499123456');
    expect(state.events.get('uid-1')?.leadId).toBe(state.leads[0]?.id);
  });

  it('does not create a second Lead for the same uid', async () => {
    await service.ingestCallEvent(inboundStart());
    await service.ingestCallEvent(inboundStart({ state: 'start' }));
    await service.ingestCallEvent(
      inboundStart({ state: 'finish', disposition: 'ANSWERED', billsec: '42' }),
    );

    expect(state.leads).toHaveLength(1);
    expect(prisma.lead.create).toHaveBeenCalledTimes(1);
  });

  it('reuses an open Lead with the same phone (dedupe)', async () => {
    state.leads.push({
      id: 'existing-lead',
      phone: '+37499123456',
      status: 'NEW',
      trashedAt: null,
      code: 'L-2026-0001',
    });

    await service.ingestCallEvent(inboundStart({ uid: 'uid-2' }));

    expect(prisma.lead.create).not.toHaveBeenCalled();
    expect(state.events.get('uid-2')?.leadId).toBe('existing-lead');
  });

  it('skips Lead creation for outbound calls', async () => {
    await service.ingestCallEvent(
      inboundStart({ calldirect: '1', uid: 'out-1', clid: '+37499123456' }),
    );

    expect(state.events.has('out-1')).toBe(true);
    expect(state.leads).toHaveLength(0);
    expect(prisma.lead.create).not.toHaveBeenCalled();
  });

  it('does not create Lead on finish-only first sight', async () => {
    await service.ingestCallEvent(
      inboundStart({ state: 'finish', disposition: 'NO ANSWER', billsec: '0' }),
    );

    expect(state.leads).toHaveLength(0);
    expect(state.events.get('uid-1')?.leadId).toBeNull();
  });
});
