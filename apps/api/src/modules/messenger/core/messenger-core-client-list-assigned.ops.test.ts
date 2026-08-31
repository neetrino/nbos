import { describe, expect, it, vi } from 'vitest';
import { listAssignedConversationIds } from './messenger-core-client-list-assigned.ops';

describe('listAssignedConversationIds', () => {
  it('includes a default Product PM conversation that is older than the newest page', async () => {
    const prisma = {
      employee: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      messengerConversationAttention: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      productCommunicationBinding: {
        findMany: vi
          .fn()
          .mockResolvedValue([
            { conversationId: 'old-assigned', productId: 'prod-1', purpose: 'WORK' },
          ]),
      },
    };
    const ids = await listAssignedConversationIds(prisma as never, 'pm-1', { zone: 'CLIENT' });
    expect(ids).toEqual(['old-assigned']);
    expect(prisma.productCommunicationBinding.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          conversation: { zone: 'CLIENT' },
        }),
      }),
    );
  });

  it('keeps a ROLE override assigned to the current Product PM', async () => {
    const prisma = {
      employee: { findMany: vi.fn().mockResolvedValue([]) },
      messengerConversationAttention: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ conversationId: 'conv-role' }])
          .mockResolvedValueOnce([]),
      },
      productCommunicationBinding: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const ids = await listAssignedConversationIds(prisma as never, 'pm-1', {});
    expect(ids).toContain('conv-role');
  });

  it('matches Intake Assigned by Hub maintenance subscription, not product.status DONE', async () => {
    const prisma = {
      employee: { findMany: vi.fn().mockResolvedValue([{ id: 'intake-1' }]) },
      messengerConversationAttention: { findMany: vi.fn().mockResolvedValue([]) },
      productCommunicationBinding: { findMany: vi.fn().mockResolvedValue([]) },
    };
    await listAssignedConversationIds(prisma as never, 'intake-1', { zone: 'CLIENT' });
    const where = prisma.productCommunicationBinding.findMany.mock.calls[0]?.[0]?.where as {
      OR: unknown;
    };
    expect(JSON.stringify(where)).not.toMatch(/DONE/);
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          purpose: 'WORK',
          product: {
            subscriptions: {
              some: {
                type: { in: ['MAINTENANCE_ONLY', 'DEV_AND_MAINTENANCE'] },
                status: { in: ['PENDING', 'ACTIVE'] },
              },
            },
          },
        }),
        expect.objectContaining({
          purpose: 'WORK',
          product: expect.objectContaining({
            pmId: 'intake-1',
            subscriptions: {
              none: {
                type: { in: ['MAINTENANCE_ONLY', 'DEV_AND_MAINTENANCE'] },
                status: { in: ['PENDING', 'ACTIVE'] },
              },
            },
          }),
        }),
      ]),
    );
  });
});
