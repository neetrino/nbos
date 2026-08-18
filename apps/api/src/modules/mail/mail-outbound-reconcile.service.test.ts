import { describe, expect, it, vi } from 'vitest';
import { MailOutboundReconcileService } from './mail-outbound-reconcile.service';

describe('MailOutboundReconcileService', () => {
  it('re-enqueues orphan QUEUED rows', async () => {
    const enqueueSend = vi.fn().mockResolvedValue(true);
    const prisma = {
      emailMessage: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ id: 'm1', mailAccountId: 'a1' }])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]),
        updateMany: vi.fn(),
      },
      mailDeliveryLog: { findFirst: vi.fn().mockResolvedValue({ actorEmployeeId: 'e1' }) },
    };
    const service = new MailOutboundReconcileService(
      prisma as never,
      { enqueueSend } as never,
      { log: vi.fn() } as never,
    );
    const result = await service.reconcileOrphans();
    expect(enqueueSend).toHaveBeenCalledWith({
      mailAccountId: 'a1',
      messageId: 'm1',
      actorEmployeeId: 'e1',
    });
    expect(result.queuedEnqueued).toBe(1);
  });

  it('returns stale SENDING without provider id to QUEUED and enqueues', async () => {
    const enqueueSend = vi.fn().mockResolvedValue(true);
    const prisma = {
      emailMessage: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([{ id: 'm2', mailAccountId: 'a1' }])
          .mockResolvedValueOnce([]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      mailDeliveryLog: { findFirst: vi.fn().mockResolvedValue({ actorEmployeeId: 'e1' }) },
    };
    const service = new MailOutboundReconcileService(
      prisma as never,
      { enqueueSend } as never,
      { log: vi.fn() } as never,
    );
    const result = await service.reconcileOrphans();
    expect(prisma.emailMessage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { deliveryStatus: 'QUEUED' } }),
    );
    expect(enqueueSend).toHaveBeenCalled();
    expect(result.sendingRequeued).toBe(1);
  });

  it('finalizes SENDING with provider id and does not enqueue a resend', async () => {
    const enqueueSend = vi.fn();
    const prisma = {
      emailMessage: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            { id: 'm3', mailAccountId: 'a1', providerMessageId: 'p9', messageIdHeader: null },
          ]),
        update: vi.fn().mockResolvedValue({ threadId: 't1' }),
        updateMany: vi.fn(),
      },
      emailThread: { update: vi.fn() },
      mailDeliveryLog: {
        findFirst: vi.fn().mockResolvedValue({ actorEmployeeId: 'e1' }),
        create: vi.fn(),
      },
    };
    const service = new MailOutboundReconcileService(
      prisma as never,
      { enqueueSend } as never,
      { log: vi.fn() } as never,
    );
    const result = await service.reconcileOrphans();
    expect(enqueueSend).not.toHaveBeenCalled();
    expect(prisma.emailMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deliveryStatus: 'SENT' }) }),
    );
    expect(result.sendingFinalized).toBe(1);
  });
});
