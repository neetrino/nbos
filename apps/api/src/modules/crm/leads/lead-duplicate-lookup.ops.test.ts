import { describe, expect, it, vi } from 'vitest';
import { findLeadDuplicateCandidates, findOpenLeadByPhone } from './lead-duplicate-lookup.ops';

function leadRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lead-1',
    code: 'L-2026-0001',
    name: 'Site',
    contactName: 'Anna',
    phone: '+37499123456',
    email: null,
    status: 'NEW',
    assignedTo: null,
    createdAt: new Date('2026-01-01'),
    source: 'MARKETING',
    sourceDetail: 'SMM',
    deal: null,
    ...overrides,
  };
}

describe('findOpenLeadByPhone', () => {
  it('attaches to an open non-SQL Lead and skips Spam / absorbed', async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: 'open-1' });
    const db = { lead: { findFirst } };
    const found = await findOpenLeadByPhone(db as never, '+37499123456');
    expect(found?.id).toBe('open-1');
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          trashedAt: null,
          mergedIntoId: null,
          status: { notIn: ['SQL', 'SPAM'] },
          phone: { in: expect.arrayContaining(['+37499123456', '37499123456']) },
        }),
      }),
    );
  });

  it('does not look up when phone cannot be used', async () => {
    const findFirst = vi.fn();
    await findOpenLeadByPhone({ lead: { findFirst } } as never, '   ');
    expect(findFirst).not.toHaveBeenCalled();
  });
});

describe('findLeadDuplicateCandidates', () => {
  it('returns empty when no identity or search is provided', async () => {
    const result = await findLeadDuplicateCandidates({} as never, {});
    expect(result).toEqual({ leads: [], contacts: [], openDeals: [] });
  });

  it('includes Spam in the banner but marks it not open for attach', async () => {
    const db = {
      lead: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([leadRow({ id: 'spam-1', status: 'SPAM' })])
          .mockResolvedValueOnce([]),
      },
      contact: { findMany: vi.fn().mockResolvedValue([]) },
      deal: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const result = await findLeadDuplicateCandidates(db as never, { phone: '+37499123456' });
    expect(result.leads[0]?.isSpam).toBe(true);
    expect(result.leads[0]?.isOpenForAttach).toBe(false);
  });

  it('flags an open Deal on a matching Lead', async () => {
    const db = {
      lead: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([
            leadRow({
              deal: { id: 'deal-1', code: 'D-1', status: 'START_CONVERSATION', trashedAt: null },
            }),
          ])
          .mockResolvedValueOnce([]),
      },
      contact: { findMany: vi.fn().mockResolvedValue([]) },
      deal: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'deal-1',
            code: 'D-1',
            status: 'START_CONVERSATION',
            contactId: null,
            leadId: 'lead-1',
          },
        ]),
      },
    };
    const result = await findLeadDuplicateCandidates(db as never, { phone: '+37499123456' });
    expect(result.leads[0]?.hasOpenDeal).toBe(true);
    expect(result.openDeals).toHaveLength(1);
  });
});
