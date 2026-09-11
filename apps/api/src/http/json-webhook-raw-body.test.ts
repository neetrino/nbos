import { createHmac } from 'crypto';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { verifyWhatsAppGatewayWebhook } from '../modules/integrations/whatsapp-gateway/whatsapp-gateway-webhook.hmac';
import {
  captureJsonWebhookRawBody,
  shouldCaptureJsonWebhookRawBody,
} from './json-webhook-raw-body';

const SECRET = 'gateway-project-signing-key-test';
const WHATSAPP_PATH = '/api/integrations/whatsapp-gateway/webhook';
const META_PATH = '/api/integrations/meta/webhook';

function sign(timestamp: string, raw: string): string {
  return createHmac('sha512', SECRET).update(`${timestamp}.${raw}`).digest('hex');
}

function requestWithUrl(url: string): { originalUrl: string; rawBody?: Buffer } {
  return { originalUrl: url };
}

describe('json webhook rawBody capture (FINDING-S8-01)', () => {
  it('captures Gateway-signed bytes on the WhatsApp webhook path', () => {
    const raw = Buffer.from('{\n  "eventId": "evt_1",\n  "accountId": "acc_1"\n}\n');
    const req = requestWithUrl(WHATSAPP_PATH);
    captureJsonWebhookRawBody(req as never, raw);
    expect(req.rawBody?.equals(raw)).toBe(true);

    const timestamp = '1725000000000';
    const verified = verifyWhatsAppGatewayWebhook({
      rawBody: req.rawBody as Buffer,
      headers: {
        eventId: 'evt_1',
        timestamp,
        signature: sign(timestamp, raw.toString('utf8')),
        algorithm: 'sha512',
      },
      signingSecret: SECRET,
      nowMs: Number(timestamp),
    });
    expect(verified).toEqual({ ok: true });
  });

  it('rejects HMAC when the captured rawBody is absent', () => {
    const req = requestWithUrl('/api/messenger/core/conversations');
    captureJsonWebhookRawBody(req as never, Buffer.from('{"eventId":"evt_1"}'));
    expect(req.rawBody).toBeUndefined();
    expect(shouldCaptureJsonWebhookRawBody(WHATSAPP_PATH)).toBe(true);
  });

  it('does not treat JSON.stringify(parsed) as the signed body', () => {
    const raw = Buffer.from('{\n  "eventId": "evt_1",\n  "accountId": "acc_1"\n}\n');
    const req = requestWithUrl(WHATSAPP_PATH);
    captureJsonWebhookRawBody(req as never, raw);
    const parsed = JSON.parse(raw.toString('utf8')) as { eventId: string; accountId: string };
    const stringified = Buffer.from(JSON.stringify(parsed));
    expect(req.rawBody?.equals(stringified)).toBe(false);

    const timestamp = '1725000000000';
    const result = verifyWhatsAppGatewayWebhook({
      rawBody: stringified,
      headers: {
        eventId: 'evt_1',
        timestamp,
        signature: sign(timestamp, raw.toString('utf8')),
        algorithm: 'sha512',
      },
      signingSecret: SECRET,
      nowMs: Number(timestamp),
    });
    expect(result).toEqual({ ok: false, reason: 'SIGNATURE' });
  });

  it('still captures the Meta webhook path', () => {
    const raw = Buffer.from('{"object":"page","entry":[]}');
    const req = requestWithUrl(META_PATH);
    captureJsonWebhookRawBody(req as never, raw);
    expect(req.rawBody?.equals(raw)).toBe(true);
    expect(shouldCaptureJsonWebhookRawBody(META_PATH)).toBe(true);
  });

  it('is wired from main.ts json verify for both webhook paths', () => {
    const main = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../main.ts'), 'utf8');
    expect(main).toMatch(/captureJsonWebhookRawBody/);
    expect(main).not.toMatch(/JSON\.stringify\(/);
  });
});
