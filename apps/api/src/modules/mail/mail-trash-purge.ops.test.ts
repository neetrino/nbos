import { describe, expect, it, vi } from 'vitest';
import { purgeTrashedMailThreadsPastRetention } from './mail-trash-purge.ops';

describe('purgeTrashedMailThreadsPastRetention', () => {
  it('hard-deletes trashed threads past retention and audits each row', async () => {
    const auditService = { log: vi.fn() };
    const prisma = {
      emailThread: {
        findMany: vi
          .fn()
          .mockResolvedValue([
            { id: 'thread-1', mailAccountId: 'acc-1', subjectNormalized: 'Hello' },
          ]),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    } as never;

    const result = await purgeTrashedMailThreadsPastRetention(
      prisma,
      auditService as never,
      new Date('2026-07-12T00:00:00.000Z'),
    );

    expect(result.purged).toBe(1);
    expect(result.candidateIds).toEqual(['thread-1']);
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'mail.thread_retention_purged', entityId: 'thread-1' }),
    );
  });
});
