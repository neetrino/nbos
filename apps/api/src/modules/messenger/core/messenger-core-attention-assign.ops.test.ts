import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { assignConversationAttention } from './messenger-core-attention-assign.ops';

describe('assignConversationAttention', () => {
  it('deletes the override when Product PM is the computed default', async () => {
    const prisma = assignPrisma({
      product: { id: 'prod-1', pmId: 'pm-1', name: 'Site', subscriptions: [] },
    });
    await assignConversationAttention(prisma as never, {
      conversationId: 'conv-1',
      productId: 'prod-1',
      purpose: 'WORK',
      ownerKind: 'ROLE',
      assignedById: 'e1',
    });
    expect(prisma.messengerConversationAttention.deleteMany).toHaveBeenCalledWith({
      where: { conversationId: 'conv-1', productId: 'prod-1', purpose: 'WORK' },
    });
    expect(prisma.messengerConversationAttention.upsert).not.toHaveBeenCalled();
  });

  it('stores a Product PM ROLE override when default is Support Intake', async () => {
    const prisma = assignPrisma({
      product: {
        id: 'prod-1',
        pmId: 'pm-1',
        name: 'Site',
        subscriptions: [{ type: 'MAINTENANCE_ONLY', status: 'ACTIVE' }],
      },
    });
    await assignConversationAttention(prisma as never, {
      conversationId: 'conv-1',
      productId: 'prod-1',
      purpose: 'WORK',
      ownerKind: 'ROLE',
      assignedById: 'e1',
    });
    expect(prisma.messengerConversationAttention.deleteMany).not.toHaveBeenCalled();
    expect(prisma.messengerConversationAttention.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          ownerKind: 'ROLE',
          ownerEmployeeId: null,
          ownerRole: 'PRODUCT_PM',
        }),
      }),
    );
  });

  it('rejects an arbitrary EMPLOYEE owner who is not a participant or queue member', async () => {
    const prisma = assignPrisma({
      product: { id: 'prod-1', pmId: 'pm-1', name: 'Site', subscriptions: [] },
    });
    prisma.messengerConversationParticipant.findFirst.mockResolvedValue(null);
    prisma.employee.findMany.mockResolvedValue([]);
    await expect(
      assignConversationAttention(prisma as never, {
        conversationId: 'conv-1',
        productId: 'prod-1',
        purpose: 'WORK',
        ownerKind: 'EMPLOYEE',
        ownerEmployeeId: 'stranger',
        assignedById: 'e1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function assignPrisma(input: {
  product: {
    id: string;
    pmId: string | null;
    name: string;
    subscriptions: Array<{ type: string; status: string }>;
  };
}) {
  return {
    productCommunicationBinding: {
      findFirst: vi.fn().mockResolvedValue({ product: input.product }),
      findMany: vi.fn().mockResolvedValue([
        {
          conversationId: 'conv-1',
          productId: input.product.id,
          purpose: 'WORK',
          product: input.product,
        },
      ]),
    },
    messengerConversationAttention: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    messengerConversationParticipant: {
      findFirst: vi.fn().mockResolvedValue({ employeeId: 'e1' }),
    },
    employee: { findMany: vi.fn().mockResolvedValue([]) },
  };
}
