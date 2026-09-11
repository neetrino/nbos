import { createHmac } from 'crypto';
import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { WHATSAPP_ERROR } from './whatsapp-gateway.constants';
import { WhatsAppGatewayWebhookService } from './whatsapp-gateway-webhook.service';

const SECRET = 'gateway-project-signing-key-test';
const ACCOUNT = 'acc_a';
const CHAT = '37499111222@c.us';
const PROVIDER_MESSAGE_ID = 'wamid-1';
const EVENT_ID = 'evt_ack_1';

function sign(timestamp: string, raw: string): string {
  return createHmac('sha512', SECRET).update(`${timestamp}.${raw}`).digest('hex');
}

function ackBody() {
  return {
    eventId: EVENT_ID,
    accountId: ACCOUNT,
    type: 'message.ack',
    data: { messageId: PROVIDER_MESSAGE_ID, ack: 2, chatId: CHAT },
  };
}

function echoBody() {
  return {
    eventId: 'evt_echo_1',
    accountId: ACCOUNT,
    type: 'message.received',
    data: { messageId: 'wamid-me', fromMe: true, chatId: CHAT, body: 'echo' },
  };
}

function signedCall(body: ReturnType<typeof ackBody> | ReturnType<typeof echoBody>) {
  const raw = Buffer.from(JSON.stringify(body));
  const timestamp = String(Date.now());
  return {
    raw,
    headers: {
      eventId: body.eventId,
      timestamp,
      signature: sign(timestamp, raw.toString('utf8')),
      algorithm: 'sha512',
    },
    body,
  };
}

function messageRow(status: string) {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'e1',
    senderNameSnapshot: 'Ada',
    content: 'hi',
    direction: 'OUTBOUND',
    status,
    provenance: 'EMPLOYEE',
    replyToMessageId: null,
    threadRootMessageId: null,
    createdAt: new Date(),
    editedAt: null,
    attachments: [],
    mentions: [],
    referencesAsTarget: [],
  };
}

describe('WhatsApp webhook retryable ACK miss (FINDING-S8-07)', () => {
  it('does not SKIP MESSAGE_NOT_FOUND; a later RECEIVED delivery of the same eventId applies', async () => {
    const stored = { status: 'SENDING' };
    const prisma = {
      messengerProviderEvent: {
        create: vi
          .fn()
          .mockResolvedValueOnce({ id: 'pe-1' })
          .mockRejectedValueOnce({ code: 'P2002' }),
        findUnique: vi.fn().mockResolvedValue({ id: 'pe-1', status: 'RECEIVED' }),
        update: vi.fn().mockResolvedValue({}),
      },
      messengerMessageExternalRef: {
        findUnique: vi.fn().mockResolvedValueOnce(null).mockResolvedValue({ messageId: 'msg-1' }),
      },
      messengerMessage: {
        findUnique: vi.fn(async () => messageRow(stored.status)),
        updateMany: vi.fn(async ({ data }: { data: { status: string } }) => {
          stored.status = data.status;
          return { count: 1 };
        }),
      },
      messengerCommand: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'cmd-1',
          idempotencyKey: 'core-wa-send:msg-1',
          kind: 'SEND_MESSAGE',
          status: 'PENDING',
          resultMessageId: 'msg-1',
          conversationId: 'conv-1',
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue({}),
      },
      $queryRaw: vi.fn().mockResolvedValue([
        {
          id: 'cmd-1',
          idempotencyKey: 'core-wa-send:msg-1',
          kind: 'SEND_MESSAGE',
          status: 'PENDING',
          resultMessageId: 'msg-1',
          conversationId: 'conv-1',
        },
      ]),
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'a1' }) },
    };
    const service = new WhatsAppGatewayWebhookService(
      prisma as never,
      { requireWebhookSigningSecret: vi.fn().mockResolvedValue(SECRET) } as never,
      { emitCoreConversationMessage: vi.fn(), publishPersistedCoreMessage: vi.fn() } as never,
    );
    const first = signedCall(ackBody());
    await expect(
      service.handleWebhook(first.raw, first.headers, first.body),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.messengerProviderEvent.update).not.toHaveBeenCalled();

    const retry = signedCall(ackBody());
    await expect(service.handleWebhook(retry.raw, retry.headers, retry.body)).resolves.toEqual({
      received: true,
    });
    expect(stored.status).toBe('DELIVERED');
    expect(prisma.messengerProviderEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pe-1' },
        data: expect.objectContaining({ status: 'PROCESSED', skipReason: null }),
      }),
    );
  });

  it('still SKIPPED + 200 for FROM_ME_ECHO', async () => {
    const prisma = {
      messengerProviderEvent: {
        create: vi.fn().mockResolvedValue({ id: 'pe-echo' }),
        update: vi.fn().mockResolvedValue({}),
      },
    };
    const gateway = {
      emitCoreConversationMessage: vi.fn(),
      publishPersistedCoreMessage: vi.fn(),
    };
    const service = new WhatsAppGatewayWebhookService(
      prisma as never,
      { requireWebhookSigningSecret: vi.fn().mockResolvedValue(SECRET) } as never,
      gateway as never,
    );
    const call = signedCall(echoBody());
    await expect(service.handleWebhook(call.raw, call.headers, call.body)).resolves.toEqual({
      received: true,
    });
    expect(prisma.messengerProviderEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SKIPPED', skipReason: 'FROM_ME_ECHO' }),
      }),
    );
    expect(gateway.publishPersistedCoreMessage).not.toHaveBeenCalled();
    expect(gateway.emitCoreConversationMessage).not.toHaveBeenCalled();
  });

  it('returns 503 with WEBHOOK_MESSAGE_NOT_READY on ACK before ref', async () => {
    const prisma = {
      messengerProviderEvent: {
        create: vi.fn().mockResolvedValue({ id: 'pe-1' }),
        update: vi.fn(),
      },
      messengerMessageExternalRef: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    const service = new WhatsAppGatewayWebhookService(
      prisma as never,
      { requireWebhookSigningSecret: vi.fn().mockResolvedValue(SECRET) } as never,
      { emitCoreConversationMessage: vi.fn(), publishPersistedCoreMessage: vi.fn() } as never,
    );
    const call = signedCall(ackBody());
    try {
      await service.handleWebhook(call.raw, call.headers, call.body);
      throw new Error('expected ServiceUnavailableException');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect((error as ServiceUnavailableException).getResponse()).toEqual(
        expect.objectContaining({ code: WHATSAPP_ERROR.WEBHOOK_MESSAGE_NOT_READY }),
      );
    }
    expect(prisma.messengerProviderEvent.update).not.toHaveBeenCalled();
  });
});
