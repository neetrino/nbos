import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { WHATSAPP_ERROR } from './whatsapp-gateway.constants';
import { WhatsAppGatewayWebhookService } from './whatsapp-gateway-webhook.service';

describe('WhatsApp webhook rawBody (FINDING-S8-01)', () => {
  it('rejects a missing rawBody as WEBHOOK_INVALID_SIGNATURE', async () => {
    const connection = {
      requireWebhookSigningSecret: vi.fn().mockResolvedValue('secret'),
    };
    const service = new WhatsAppGatewayWebhookService(
      {} as never,
      connection as never,
      { emitCoreConversationMessage: vi.fn() } as never,
    );
    const headers = {
      eventId: 'evt_1',
      timestamp: '1725000000000',
      signature: 'ab'.repeat(32),
      algorithm: 'sha512',
    };
    const body = { eventId: 'evt_1', accountId: 'acc_1', type: 'message.received' };
    try {
      await service.handleWebhook(undefined, headers, body);
      throw new Error('expected UnauthorizedException');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as UnauthorizedException).getResponse()).toEqual(
        expect.objectContaining({ code: WHATSAPP_ERROR.WEBHOOK_INVALID_SIGNATURE }),
      );
    }
  });
});
