import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { permanentlyDeleteTrashedMailThread } from './mail-thread-permanent-delete.ops';

describe('permanentlyDeleteTrashedMailThread', () => {
  it('hard-deletes trashed thread and writes audit', async () => {
    const auditService = { log: vi.fn() };
    const trashedAt = new Date('2026-06-01');
    const prisma = {
      emailThread: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'thread-1',
          mailAccountId: 'acc-1',
          subjectNormalized: 'Hello',
          trashedAt,
          mailAccount: { id: 'acc-1' },
        }),
        delete: vi.fn().mockResolvedValue({ id: 'thread-1' }),
      },
      mailAccount: {
        findFirst: vi.fn().mockResolvedValue({ id: 'acc-1' }),
      },
    } as never;

    const result = await permanentlyDeleteTrashedMailThread(prisma, auditService as never, {
      employeeId: 'emp-1',
      accessScope: 'OWN',
      threadId: 'thread-1',
    });

    expect(result).toEqual({ ok: true, threadId: 'thread-1' });
    expect(prisma.emailThread.delete).toHaveBeenCalledWith({ where: { id: 'thread-1' } });
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'mail.thread_permanently_deleted',
        entityId: 'thread-1',
        userId: 'emp-1',
      }),
    );
  });

  it('returns not_found when mailbox access is missing', async () => {
    const auditService = { log: vi.fn() };
    const prisma = {
      emailThread: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'thread-1',
          mailAccountId: 'acc-1',
          trashedAt: new Date(),
          mailAccount: { id: 'acc-1' },
        }),
      },
      mailAccount: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as never;

    const result = await permanentlyDeleteTrashedMailThread(prisma, auditService as never, {
      employeeId: 'emp-1',
      accessScope: 'OWN',
      threadId: 'thread-1',
    });

    expect(result).toEqual({ ok: false, reason: 'not_found' });
  });

  it('rejects active threads', async () => {
    const prisma = {
      emailThread: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'thread-1',
          mailAccountId: 'acc-1',
          trashedAt: null,
          mailAccount: { id: 'acc-1' },
        }),
      },
      mailAccount: {
        findFirst: vi.fn().mockResolvedValue({ id: 'acc-1' }),
      },
    } as never;

    await expect(
      permanentlyDeleteTrashedMailThread(prisma, { log: vi.fn() } as never, {
        employeeId: 'emp-1',
        accessScope: 'OWN',
        threadId: 'thread-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
