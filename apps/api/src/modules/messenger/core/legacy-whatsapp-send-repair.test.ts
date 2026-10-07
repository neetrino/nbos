import { describe, expect, it, vi } from 'vitest';
import { whatsAppOutboundIdempotencyKey } from './messenger-wa-identity';
import {
  commitLegacyDefaultSendRepair,
  decideLegacyDefaultSendRepair,
  repairLegacyDefaultWhatsAppSend,
} from './legacy-whatsapp-send-repair.ops';

const CHAT = '120363408874132550@g.us';
const MESSAGE_ID = 'msg-1';

function snapshot(overrides?: {
  messageStatus?: string;
  commandAccount?: string;
  chatId?: string;
  hasExternalRef?: boolean;
  destination?: 'accessible' | 'missing' | 'unavailable';
  commandStatus?: string;
}) {
  return {
    command: {
      id: 'cmd-1',
      kind: 'SEND_MESSAGE',
      status: overrides?.commandStatus ?? 'FAILED',
      conversationId: 'conv-1',
      resultMessageId: MESSAGE_ID,
      idempotencyKey: whatsAppOutboundIdempotencyKey(MESSAGE_ID),
      payload: {
        accountId: overrides?.commandAccount ?? 'default',
        chatId: overrides?.chatId ?? CHAT,
      },
      dispatchToken: null,
    },
    message: {
      id: MESSAGE_ID,
      conversationId: 'conv-1',
      status: overrides?.messageStatus ?? 'FAILED',
      deletedAt: null,
    },
    mapping: { externalAccountId: 'acc_live', externalConversationId: CHAT },
    hasExternalRef: overrides?.hasExternalRef ?? false,
    destination: overrides?.destination ?? 'accessible',
  };
}

describe('legacy default send repair', () => {
  it('repairs one failed default-routed send onto the verified account', () => {
    const decision = decideLegacyDefaultSendRepair(snapshot());
    expect(decision.action).toBe('repair');
    if (decision.action !== 'repair') return;
    expect(decision.accountId).toBe('acc_live');
    expect(decision.chatId).toBe(CHAT);
    expect(decision.idempotencyKey).toBe(whatsAppOutboundIdempotencyKey(MESSAGE_ID));
  });

  it('rejects a message that is already sent', () => {
    expect(decideLegacyDefaultSendRepair(snapshot({ messageStatus: 'SENT' })).reason).toBe(
      'delivery_proof',
    );
  });

  it('rejects a message that already has a provider ref', () => {
    expect(decideLegacyDefaultSendRepair(snapshot({ hasExternalRef: true })).reason).toBe(
      'delivery_proof',
    );
  });

  it('rejects a current chat that differs from the command', () => {
    expect(
      decideLegacyDefaultSendRepair(snapshot({ chatId: '120363000000000001@g.us' })).reason,
    ).toBe('chat_mismatch');
  });

  it('rejects an unexplained account that is not the legacy default', () => {
    expect(
      decideLegacyDefaultSendRepair(snapshot({ commandAccount: 'other-account' })).reason,
    ).toBe('not_legacy_account');
  });

  it('lets only one of two concurrent repairs commit', async () => {
    const plan = decideLegacyDefaultSendRepair(snapshot());
    if (plan.action !== 'repair') throw new Error('expected repair');
    const state = { messageStatus: 'FAILED', commandStatus: 'FAILED', writes: 0 };
    const prisma = memoryPrisma(state);
    const first = await commitLegacyDefaultSendRepair(prisma as never, plan);
    const second = await commitLegacyDefaultSendRepair(prisma as never, plan);
    expect(first).toBe('repaired');
    expect(second).toBe('lost_race');
    expect(state.writes).toBe(1);
    expect(state.commandStatus).toBe('PENDING');
    expect(state.messageStatus).toBe('QUEUED');
  });

  it('does not write when the loaded message is already sent', async () => {
    const updateMany = vi.fn();
    const prisma = {
      messengerMessage: {
        findUnique: vi.fn().mockResolvedValue({
          id: MESSAGE_ID,
          conversationId: 'conv-1',
          status: 'SENT',
          deletedAt: null,
        }),
        updateMany,
      },
      messengerCommand: {
        findUnique: vi.fn().mockResolvedValue(snapshot().command),
        updateMany,
      },
      messengerExternalConversationMapping: {
        findFirst: vi.fn().mockResolvedValue(snapshot().mapping),
      },
      messengerMessageExternalRef: { findFirst: vi.fn().mockResolvedValue(null) },
      $transaction: vi.fn(),
    };
    const result = await repairLegacyDefaultWhatsAppSend(prisma as never, MESSAGE_ID, async () => {
      throw new Error('probe should not run');
    });
    expect(result.action).toBe('reject');
    expect(result.reason).toBe('delivery_proof');
    expect(updateMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

function memoryPrisma(state: { messageStatus: string; commandStatus: string; writes: number }) {
  const tx = {
    messengerMessageExternalRef: { findFirst: vi.fn().mockResolvedValue(null) },
    messengerMessage: {
      updateMany: vi.fn(async ({ data }: { data: { status: string } }) => {
        if (state.messageStatus !== 'FAILED' && state.messageStatus !== 'QUEUED')
          return { count: 0 };
        state.messageStatus = data.status;
        return { count: 1 };
      }),
    },
    messengerCommand: {
      updateMany: vi.fn(
        async ({ data }: { data: { status: string; payload: { accountId: string } } }) => {
          if (state.commandStatus !== 'FAILED') return { count: 0 };
          state.commandStatus = data.status;
          state.writes += 1;
          expect(data.payload.accountId).toBe('acc_live');
          return { count: 1 };
        },
      ),
    },
  };
  return {
    $transaction: async (fn: (client: typeof tx) => Promise<void>) => {
      const snapshot = { ...state };
      try {
        await fn(tx);
      } catch (error) {
        state.messageStatus = snapshot.messageStatus;
        state.commandStatus = snapshot.commandStatus;
        state.writes = snapshot.writes;
        throw error;
      }
    },
  };
}
