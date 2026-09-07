import { ATS_CALLDIRECT_OUTBOUND } from './ats.constants';
import { normalizeAtsCallerPhone } from './ats-phone.util';
import { presentWebhookString } from './ats-webhook-field';
import type { AtsWebhookPayload } from './ats.types';

export type AtsClientPhoneSource = 'clid' | 'input' | 'op' | 'none';

export type AtsClientPhoneResolution = {
  raw: string | null;
  source: AtsClientPhoneSource;
};

/**
 * Direction-aware client (counterpart) phone from an ATS webhook.
 * Incoming keeps proven `clid`. Outgoing: if `op` is a real phone (not a SIP
 * extension), it is the dialed party — orange-trunk sends the office DID in
 * `input`. Otherwise `input`, then `clid`.
 */
export function resolveAtsClientPhone(payload: AtsWebhookPayload): AtsClientPhoneResolution {
  if (payload.calldirect === ATS_CALLDIRECT_OUTBOUND) {
    return resolveOutboundClientPhone(payload);
  }
  const clid = presentWebhookString(payload.clid);
  return clid ? { raw: clid, source: 'clid' } : { raw: null, source: 'none' };
}

function resolveOutboundClientPhone(payload: AtsWebhookPayload): AtsClientPhoneResolution {
  const op = presentWebhookString(payload.op);
  if (op && isAtsDialedPartyToken(op)) return { raw: op, source: 'op' };
  const input = presentWebhookString(payload.input);
  if (input) return { raw: input, source: 'input' };
  const clid = presentWebhookString(payload.clid);
  return clid ? { raw: clid, source: 'clid' } : { raw: null, source: 'none' };
}

/** True when the token is a CRM phone, not a short SIP / trunk id. */
export function isAtsDialedPartyToken(value: string): boolean {
  return normalizeAtsCallerPhone(value).success;
}
