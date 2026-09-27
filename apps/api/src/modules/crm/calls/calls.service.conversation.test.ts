import { describe, expect, it } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { CallAccessPolicyService } from './call-access-policy.service';
import { OWN_ACTOR } from './call-access.test-support';
import {
  buildCallAccessWhere,
  buildCallParentWhere,
  mergeCallListWhere,
} from './call-access.where';
import { CallsService } from './calls.service';

const ACCESS_WHERE = buildCallAccessWhere({
  leadsScope: 'OWN',
  dealsScope: 'OWN',
  actorId: OWN_ACTOR.employeeId,
  departmentEmployeeIds: [],
});

const LIST_WHERE = mergeCallListWhere(
  buildCallParentWhere('lead', { leadId: 'lead-1' }),
  ACCESS_WHERE,
);

function connection(id: string, uid: string, lid: string | null, createdAt: string) {
  return {
    id,
    uid,
    lid,
    calldirect: '0',
    phone: '+37499123456',
    clid: '+37499123456',
    state: 'finish',
    billsec: '5',
    disposition: 'ANSWERED',
    rate: null,
    leadId: 'lead-1',
    contactId: null,
    dealId: null,
    responsibleEmployeeId: 'emp-1',
    answeredEmployeeId: id === 'call-b' ? 'emp-anna' : null,
    createdAt: new Date(createdAt),
    updatedAt: new Date(createdAt),
    lead: { name: 'Website', contactName: 'Website' },
    contact: null,
    deal: null,
    responsibleEmployee: { firstName: 'Edgar', lastName: 'Sargsyan' },
    answeredEmployee: id === 'call-b' ? { firstName: 'Anna', lastName: 'Petrosyan' } : null,
    initiatedByEmployee: null,
    note: null,
    recordingStatus: null,
  };
}

function createService() {
  const prisma = createMockPrisma();
  const service = new CallsService(prisma as never, new CallAccessPolicyService(prisma as never));
  return { prisma, service };
}

describe('CallsService conversation grouping', () => {
  it('lists one card for two UIDs and keeps the access predicate', async () => {
    const { prisma, service } = createService();
    const rows = [
      connection('call-a', 'uid-a', 'L-1', '2026-09-26T10:00:00.000Z'),
      connection('call-b', 'uid-b', 'L-1', '2026-09-26T10:00:04.000Z'),
      connection('call-c', 'uid-c', 'L-2', '2026-09-26T09:00:00.000Z'),
    ];
    prisma.atsCallEvent.findMany.mockResolvedValue(rows);

    const result = await service.findAll({ leadId: 'lead-1', page: 1, pageSize: 20 }, OWN_ACTOR);

    expect(prisma.atsCallEvent.findMany.mock.calls[0]?.[0]?.where).toEqual(LIST_WHERE);
    expect(prisma.atsCallEvent.findMany.mock.calls[1]?.[0]?.where).toEqual({
      AND: [LIST_WHERE, { id: { in: ['call-a', 'call-b', 'call-c'] } }],
    });
    expect(result.meta).toEqual({ total: 2, page: 1, pageSize: 20, totalPages: 1 });
    expect(result.items.map((item) => item.id)).toEqual(['call-a', 'call-c']);
    expect(result.items[0]).toMatchObject({
      id: 'call-a',
      uid: 'uid-a',
      answeredEmployeeId: 'emp-anna',
      employeeName: 'Anna Petrosyan',
      durationSec: 5,
    });
  });

  it('paginates by conversation, not by connection', async () => {
    const { prisma, service } = createService();
    prisma.atsCallEvent.findMany.mockResolvedValue([
      connection('call-a', 'uid-a', 'L-1', '2026-09-26T10:00:00.000Z'),
      connection('call-b', 'uid-b', 'L-1', '2026-09-26T10:00:04.000Z'),
      connection('call-c', 'uid-c', null, '2026-09-26T08:00:00.000Z'),
    ]);

    const page = await service.findJournal(
      { page: 2, pageSize: 1 },
      {
        ...OWN_ACTOR,
        permissions: { ...OWN_ACTOR.permissions, CALLS_VIEW: 'ALL' },
      },
    );

    expect(page.meta).toEqual({ total: 2, page: 2, pageSize: 1, totalPages: 2 });
    expect(page.items.map((item) => item.id)).toEqual(['call-c']);
  });

  it('loads siblings for one card only inside the access predicate', async () => {
    const { prisma, service } = createService();
    const visible = connection('call-a', 'uid-a', 'L-1', '2026-09-26T10:00:00.000Z');
    prisma.atsCallEvent.findUnique.mockResolvedValue(visible);
    prisma.atsCallEvent.findFirst.mockResolvedValue({ id: 'call-a' });
    prisma.atsCallEvent.findMany.mockResolvedValue([visible]);

    const card = await service.findById('call-a', OWN_ACTOR);

    expect(card.id).toBe('call-a');
    expect(card.employeeName).toBe('Edgar Sargsyan');
    expect(prisma.atsCallEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { AND: [ACCESS_WHERE, { lid: 'L-1' }] } }),
    );
  });

  it('keeps a single visible connection when the sibling is outside access', async () => {
    const { prisma, service } = createService();
    const visible = connection('call-b', 'uid-b', 'L-1', '2026-09-26T10:00:04.000Z');
    prisma.atsCallEvent.findMany.mockResolvedValue([visible]);

    const result = await service.findAll({ leadId: 'lead-1', page: 1, pageSize: 20 }, OWN_ACTOR);

    expect(prisma.atsCallEvent.findMany.mock.calls[0]?.[0]?.where).toEqual(LIST_WHERE);
    expect(result.meta.total).toBe(1);
    expect(result.items.map((item) => item.id)).toEqual(['call-b']);
    expect(result.items[0]?.uid).toBe('uid-b');
  });

  it('pages a large history from every conversation key', async () => {
    const { prisma, service } = createService();
    const rows = largeHistory();
    prisma.atsCallEvent.findMany.mockResolvedValue(rows);

    const page = await service.findJournal(
      { page: 2, pageSize: 20 },
      { ...OWN_ACTOR, permissions: { ...OWN_ACTOR.permissions, CALLS_VIEW: 'ALL' } },
    );

    const keyQuery = prisma.atsCallEvent.findMany.mock.calls[0]?.[0];
    expect(keyQuery?.select).toEqual({ id: true, lid: true, createdAt: true });
    expect(keyQuery?.take).toBeUndefined();
    expect(keyQuery?.skip).toBeUndefined();
    expect(page.meta).toEqual({ total: 80, page: 2, pageSize: 20, totalPages: 4 });
    expect(page.items[0]?.id).toBe('pair-L-19-a');
    expect(page.items[19]?.id).toBe('pair-L-00-a');
    expect(page.items.every((item) => item.uid.endsWith('-a'))).toBe(true);
  });
});

function largeHistory() {
  const rows: Array<ReturnType<typeof connection>> = [];
  for (let index = 0; index < 40; index += 1) {
    const lid = `L-${String(index).padStart(2, '0')}`;
    const start = new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString();
    const later = new Date(Date.UTC(2026, 0, 1, 1, index)).toISOString();
    rows.push(connection(`pair-${lid}-a`, `uid-${lid}-a`, lid, start));
    rows.push(connection(`pair-${lid}-b`, `uid-${lid}-b`, lid, later));
  }
  for (let index = 0; index < 40; index += 1) {
    const start = new Date(Date.UTC(2025, 0, 1, 0, index)).toISOString();
    rows.push(connection(`solo-${index}`, `uid-solo-${index}`, null, start));
  }
  return rows;
}
