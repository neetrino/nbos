import { describe, expect, it } from 'vitest';
import { resolveClientDestination } from './product-communication-resolver';

const WORK_JID = '120363111111111111@g.us';
const ACCOUNTANT = '120363000000000000@g.us';

describe('resolveClientDestination', () => {
  it('returns null when WORK is missing', async () => {
    const prisma = prismaWithMapping(null, null);
    await expect(resolveClientDestination(prisma as never, 'p1', 'WORK')).resolves.toBeNull();
    await expect(resolveClientDestination(prisma as never, 'p1', 'FINANCE')).resolves.toBeNull();
  });

  it('returns null when WORK mapping JID equals the accountant group', async () => {
    const prisma = prismaWithMapping(ACCOUNTANT, ACCOUNTANT);
    await expect(resolveClientDestination(prisma as never, 'p1', 'WORK')).resolves.toBeNull();
    await expect(resolveClientDestination(prisma as never, 'p1', 'FINANCE')).resolves.toBeNull();
  });

  it('returns WORK when mapping is not the accountant group', async () => {
    const prisma = prismaWithMapping(WORK_JID, ACCOUNTANT);
    const work = await resolveClientDestination(prisma as never, 'p1', 'WORK');
    const finance = await resolveClientDestination(prisma as never, 'p1', 'FINANCE');
    expect(work?.groupChatId).toBe(WORK_JID);
    expect(finance?.groupChatId).toBe(WORK_JID);
    expect(finance?.fallbackFromWork).toBe(true);
  });
});

function prismaWithMapping(workChatId: string | null, accountantGroupChatId: string | null) {
  return {
    whatsAppGatewayConnection: {
      findFirst: async () => ({ accountingGroupChatId: accountantGroupChatId }),
    },
    productCommunicationBinding: {
      findUnique: async ({ where }: { where: { productId_purpose: { purpose: string } } }) => {
        if (where.productId_purpose.purpose === 'FINANCE' || !workChatId) return null;
        return {
          conversationId: 'conv-work',
          conversation: {
            externalMappings: [{ externalAccountId: 'acc', externalConversationId: workChatId }],
          },
        };
      },
    },
  };
}
