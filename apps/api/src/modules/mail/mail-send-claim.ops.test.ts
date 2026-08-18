import { describe, expect, it, vi } from 'vitest';
import { gateOutboundSendAttempt } from './mail-send-claim.ops';

describe('gateOutboundSendAttempt', () => {
  it('exits when already SENT and does not claim', async () => {
    const prisma = {
      emailMessage: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'm1',
          mailAccountId: 'a1',
          direction: 'OUTBOUND',
          deliveryStatus: 'SENT',
          providerMessageId: 'p1',
        }),
        updateMany: vi.fn(),
      },
    };
    await expect(gateOutboundSendAttempt(prisma as never, 'm1', 'a1')).resolves.toEqual({
      action: 'exit',
    });
    expect(prisma.emailMessage.updateMany).not.toHaveBeenCalled();
  });

  it('claims QUEUED → SENDING for a single winner', async () => {
    const prisma = {
      emailMessage: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'm1',
          mailAccountId: 'a1',
          direction: 'OUTBOUND',
          deliveryStatus: 'QUEUED',
          providerMessageId: null,
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    await expect(gateOutboundSendAttempt(prisma as never, 'm1', 'a1')).resolves.toEqual({
      action: 'send',
    });
  });

  it('exits when the QUEUED claim loses the race', async () => {
    const prisma = {
      emailMessage: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'm1',
          mailAccountId: 'a1',
          direction: 'OUTBOUND',
          deliveryStatus: 'QUEUED',
          providerMessageId: null,
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };
    await expect(gateOutboundSendAttempt(prisma as never, 'm1', 'a1')).resolves.toEqual({
      action: 'exit',
    });
  });

  it('finalizes SENDING that already has a provider id', async () => {
    const prisma = {
      emailMessage: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'm1',
          mailAccountId: 'a1',
          direction: 'OUTBOUND',
          deliveryStatus: 'SENDING',
          providerMessageId: 'prov-1',
        }),
        updateMany: vi.fn(),
      },
    };
    await expect(gateOutboundSendAttempt(prisma as never, 'm1', 'a1')).resolves.toEqual({
      action: 'finalize_sent',
      providerMessageId: 'prov-1',
    });
    expect(prisma.emailMessage.updateMany).not.toHaveBeenCalled();
  });
});
