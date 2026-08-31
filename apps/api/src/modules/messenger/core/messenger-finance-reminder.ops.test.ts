import { describe, expect, it, vi } from 'vitest';
import { deliverFinanceClientReminder } from './messenger-finance-reminder.ops';

describe('Slice 10 finance reminder Core persist', () => {
  it('persists SYSTEM outbound on explicit FINANCE conversation, not WORK', async () => {
    const prisma = reminderPrisma({
      financeChat: 'finance@g.us',
      workChat: 'work@g.us',
    });
    const outbound = { enqueue: vi.fn().mockResolvedValue(undefined), isAvailable: () => true };
    const delivered = await deliverFinanceClientReminder(prisma as never, outbound as never, {
      productId: 'prod-1',
      text: 'Please pay invoice INV-1',
      idempotencyKey: 'finance.invoice.payment_reminder_due:inv-1',
    });
    expect(delivered?.groupChatId).toBe('finance@g.us');
    expect(delivered?.conversationId).toBe('conv-finance');
    expect(prisma.messengerMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          conversationId: 'conv-finance',
          provenance: 'SYSTEM',
          direction: 'OUTBOUND',
          senderId: null,
        }),
      }),
    );
    expect(outbound.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'core_client_send', chatId: 'finance@g.us' }),
      false,
    );
  });

  it('falls back to WORK when FINANCE is not explicit', async () => {
    const prisma = reminderPrisma({ financeChat: null, workChat: 'work@g.us' });
    const outbound = { enqueue: vi.fn().mockResolvedValue(undefined), isAvailable: () => true };
    const delivered = await deliverFinanceClientReminder(prisma as never, outbound as never, {
      productId: 'prod-1',
      text: 'Please pay',
      idempotencyKey: 'k1',
    });
    expect(delivered?.groupChatId).toBe('work@g.us');
    expect(delivered?.conversationId).toBe('conv-work');
  });
});

function reminderPrisma(input: { financeChat: string | null; workChat: string }) {
  return {
    whatsAppGatewayConnection: {
      findFirst: vi.fn().mockResolvedValue({ accountingGroupChatId: null }),
    },
    productCommunicationBinding: {
      findUnique: vi.fn(
        async ({ where }: { where: { productId_purpose: { purpose: string } } }) => {
          if (where.productId_purpose.purpose === 'FINANCE' && input.financeChat) {
            return mapped('conv-finance', input.financeChat);
          }
          if (where.productId_purpose.purpose === 'WORK') {
            return mapped('conv-work', input.workChat);
          }
          return null;
        },
      ),
    },
    messengerMessage: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'msg-1',
        conversationId: input.financeChat ? 'conv-finance' : 'conv-work',
        senderId: null,
        senderNameSnapshot: 'Finance',
        content: 'Please pay',
        direction: 'OUTBOUND',
        status: 'QUEUED',
        provenance: 'SYSTEM',
        replyToMessageId: null,
        threadRootMessageId: null,
        createdAt: new Date(),
        editedAt: null,
        attachments: [],
      }),
    },
    messengerConversation: {
      findUnique: vi.fn().mockResolvedValue({
        id: input.financeChat ? 'conv-finance' : 'conv-work',
        zone: 'CLIENT',
      }),
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: input.financeChat ? 'conv-finance' : 'conv-work',
        zone: 'CLIENT',
      }),
      update: vi.fn(),
    },
    messengerCommand: { upsert: vi.fn().mockResolvedValue({ id: 'cmd-1', status: 'PENDING' }) },
  };
}

function mapped(conversationId: string, chatId: string) {
  return {
    conversationId,
    conversation: {
      externalMappings: [{ externalAccountId: 'acc', externalConversationId: chatId }],
    },
  };
}
