import { createHmac, timingSafeEqual } from 'crypto';
import {
  WHATSAPP_GATEWAY_WEBHOOK_REPLAY_WINDOW_MS,
  WHATSAPP_GATEWAY_WEBHOOK_SIGNATURE_ALGORITHM,
} from './whatsapp-gateway.constants';

export type WhatsAppGatewayWebhookHeaders = {
  eventId: string | undefined;
  timestamp: string | undefined;
  signature: string | undefined;
  algorithm: string | undefined;
};

export function verifyWhatsAppGatewayWebhook(input: {
  rawBody: Buffer;
  headers: WhatsAppGatewayWebhookHeaders;
  signingSecret: string;
  nowMs?: number;
}): { ok: true } | { ok: false; reason: 'SIGNATURE' | 'REPLAY' | 'ALGORITHM' | 'TIMESTAMP' } {
  if (input.headers.algorithm !== WHATSAPP_GATEWAY_WEBHOOK_SIGNATURE_ALGORITHM) {
    return { ok: false, reason: 'ALGORITHM' };
  }
  const timestampMs = parseGatewayTimestamp(input.headers.timestamp);
  if (timestampMs == null) return { ok: false, reason: 'TIMESTAMP' };
  const nowMs = input.nowMs ?? Date.now();
  if (Math.abs(nowMs - timestampMs) > WHATSAPP_GATEWAY_WEBHOOK_REPLAY_WINDOW_MS) {
    return { ok: false, reason: 'REPLAY' };
  }
  if (!input.headers.signature || !input.signingSecret) {
    return { ok: false, reason: 'SIGNATURE' };
  }
  const expected = createHmac('sha512', input.signingSecret)
    .update(`${input.headers.timestamp}.${input.rawBody.toString('utf8')}`)
    .digest('hex');
  if (!timingSafeEqualHex(expected, input.headers.signature)) {
    return { ok: false, reason: 'SIGNATURE' };
  }
  return { ok: true };
}

export function parseGatewayTimestamp(value: string | undefined): number | null {
  if (!value || !/^\d{10,16}$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function timingSafeEqualHex(expectedHex: string, actualHex: string): boolean {
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = Buffer.from(actualHex, 'hex');
  if (expected.length === 0 || expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
