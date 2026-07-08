import { createHmac, timingSafeEqual } from 'crypto';
import type { MetaMessagingWebhookBody, ParsedMetaInboundMessage } from './meta.types';

/** Verifies Meta webhook `X-Hub-Signature-256` header against raw request body. */
export function verifyMetaWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader || !appSecret) {
    return false;
  }
  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf = Buffer.from(signatureHeader, 'utf8');
  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }
  return timingSafeEqual(expectedBuf, actualBuf);
}

/** Parses inbound messaging events from Meta webhook payload. Skips delivery/read/echo. */
export function parseMetaInboundMessages(
  body: MetaMessagingWebhookBody,
): ParsedMetaInboundMessage[] {
  const results: ParsedMetaInboundMessage[] = [];
  const objectType = body.object ?? '';
  const platform: ParsedMetaInboundMessage['platform'] =
    objectType === 'instagram' ? 'INSTAGRAM' : 'FACEBOOK';

  for (const entry of body.entry ?? []) {
    const objectId = entry.id;
    for (const event of entry.messaging ?? []) {
      if (event.delivery || event.read || event.postback) {
        continue;
      }
      const message = event.message;
      if (!message?.mid || message.is_echo) {
        continue;
      }
      const senderId = event.sender?.id ?? 'unknown';
      results.push({
        eventId: message.mid,
        objectId,
        platform,
        senderId,
        senderName: null,
        messageText: message.text ?? null,
        timestamp: event.timestamp ?? entry.time ?? null,
        pageId: objectId,
        instagramBusinessAccountId: platform === 'INSTAGRAM' ? objectId : null,
      });
    }
  }
  return results;
}
