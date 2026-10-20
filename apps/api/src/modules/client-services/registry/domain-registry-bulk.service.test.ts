import { describe, expect, it, vi } from 'vitest';
import { actorContextFromUserId } from '@nbos/shared';
import { DomainRegistryBulkService } from './domain-registry-bulk.service';
import { BULK_CHECK_PAGE_SIZE, BULK_LOOKUP_TIMEOUT_MS } from './domain-registry.constants';

vi.mock('./domain-registry.constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./domain-registry.constants')>()),
  WHOIS_QUERY_GAP_MS: 0,
}));

const ACTOR = actorContextFromUserId('emp-1');

function row(id: string, name: string) {
  return { id, name, domain: null, renewalDate: null };
}

function setup(rows: ReturnType<typeof row>[], total = rows.length) {
  const prisma = {
    clientServiceRecord: {
      count: vi.fn().mockResolvedValue(total),
      findMany: vi.fn().mockResolvedValue(rows),
    },
  };
  const registry = {
    checkRow: vi.fn().mockImplementation(async (target: { id: string }) => ({
      outcome: target.id === 'bad' ? 'failed' : 'unchanged',
    })),
  };
  const service = new DomainRegistryBulkService(prisma as never, registry as never);
  return { prisma, registry, service };
}

describe('DomainRegistryBulkService', () => {
  it('checks every valid domain with cron rules and skips invalid names', async () => {
    const { prisma, registry, service } = setup([
      row('a', 'one.am'),
      row('b', 'not a domain'),
      row('c', 'two.com'),
    ]);

    const result = await service.checkPage({ cursor: null, actor: ACTOR });

    expect(registry.checkRow).toHaveBeenCalledTimes(2);
    expect(registry.checkRow).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), ACTOR, {
      force: true,
      timeoutMs: BULK_LOOKUP_TIMEOUT_MS,
    });
    expect(result).toMatchObject({ total: 3, checked: 3, done: true, nextCursor: 'c' });
    expect(result.counts).toMatchObject({ unchanged: 2, skipped: 1 });
    expect(prisma.clientServiceRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { type: 'DOMAIN', status: { not: 'CANCELLED' } },
        orderBy: { id: 'asc' },
        take: BULK_CHECK_PAGE_SIZE + 1,
      }),
    );
  });

  it('resumes after the cursor', async () => {
    const { prisma, service } = setup([row('d', 'three.am')], 4);

    await service.checkPage({ cursor: 'c', actor: ACTOR });

    expect(prisma.clientServiceRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ type: 'DOMAIN', status: { not: 'CANCELLED' } }, { id: { gt: 'c' } }] },
      }),
    );
  });

  it('counts a thrown lookup as failed and keeps checking the rest', async () => {
    const { registry, service } = setup([row('a', 'one.am'), row('b', 'two.com')]);
    registry.checkRow.mockImplementationOnce(async () => {
      throw new Error('db down');
    });

    const result = await service.checkPage({ cursor: null, actor: ACTOR });

    expect(result.counts).toMatchObject({ failed: 1, unchanged: 1 });
    expect(result.done).toBe(true);
  });

  it('is not done while more rows exist after the page', async () => {
    const rows = Array.from({ length: BULK_CHECK_PAGE_SIZE + 1 }, (_, index) =>
      row(`id-${String(index).padStart(3, '0')}`, `d${index}.io`),
    );
    const { service } = setup(rows, rows.length);

    const result = await service.checkPage({ cursor: null, actor: ACTOR, now: () => 0 });

    expect(result.done).toBe(false);
    expect(result.checked).toBe(BULK_CHECK_PAGE_SIZE);
    expect(result.nextCursor).toBe(rows[BULK_CHECK_PAGE_SIZE - 1]?.id);
  });

  it('returns the finished prefix when a lookup is still in flight', async () => {
    const { registry, service } = setup([row('a', 'one.am'), row('b', 'two.com')]);
    registry.checkRow.mockImplementation((target: { id: string }) => {
      if (target.id === 'b') return new Promise(() => undefined);
      return Promise.resolve({ outcome: 'unchanged' });
    });

    const result = await service.checkPage({
      cursor: null,
      actor: ACTOR,
      responseDeadlineMs: 50,
    });

    expect(result.checked).toBe(1);
    expect(result.nextCursor).toBe('a');
    expect(result.done).toBe(false);
  });
});
