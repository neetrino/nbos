import { createHmac } from 'crypto';
import { describe, expect, it } from 'vitest';
import { WHATSAPP_GATEWAY_WEBHOOK_REPLAY_WINDOW_MS } from './whatsapp-gateway.constants';
import { verifyWhatsAppGatewayWebhook } from './whatsapp-gateway-webhook.hmac';

const SECRET = 'gateway-project-signing-key-test';

function sign(timestamp: string, raw: string): string {
  return createHmac('sha512', SECRET).update(`${timestamp}.${raw}`).digest('hex');
}

describe('WhatsApp Gateway webhook HMAC', () => {
  const rawBody = Buffer.from('{"eventId":"evt_1","accountId":"acc_1","type":"message.received"}');
  const nowMs = 1_725_000_000_000;
  const timestamp = String(nowMs);

  it('accepts a valid sha512 signature inside the replay window', () => {
    const result = verifyWhatsAppGatewayWebhook({
      rawBody,
      headers: {
        eventId: 'evt_1',
        timestamp,
        signature: sign(timestamp, rawBody.toString('utf8')),
        algorithm: 'sha512',
      },
      signingSecret: SECRET,
      nowMs,
    });
    expect(result).toEqual({ ok: true });
  });

  it('rejects a bad signature', () => {
    const result = verifyWhatsAppGatewayWebhook({
      rawBody,
      headers: {
        eventId: 'evt_1',
        timestamp,
        signature: 'ab'.repeat(32),
        algorithm: 'sha512',
      },
      signingSecret: SECRET,
      nowMs,
    });
    expect(result).toEqual({ ok: false, reason: 'SIGNATURE' });
  });

  it('rejects timestamps outside the replay window', () => {
    const stale = String(nowMs - WHATSAPP_GATEWAY_WEBHOOK_REPLAY_WINDOW_MS - 1);
    const result = verifyWhatsAppGatewayWebhook({
      rawBody,
      headers: {
        eventId: 'evt_1',
        timestamp: stale,
        signature: sign(stale, rawBody.toString('utf8')),
        algorithm: 'sha512',
      },
      signingSecret: SECRET,
      nowMs,
    });
    expect(result).toEqual({ ok: false, reason: 'REPLAY' });
  });
});
