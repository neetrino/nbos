import { ATS_CALLDIRECT_OUTBOUND } from './ats.constants';
import { presentWebhookString } from './ats-webhook-field';
import type { AtsWebhookPayload } from './ats.types';

export type AtsClientPhoneSource = 'clid' | 'input' | 'none';

export type AtsClientPhoneResolution = {
  raw: string | null;
  source: AtsClientPhoneSource;
};

/**
 * Direction-aware client (counterpart) phone from an ATS webhook.
 * Incoming keeps proven `clid`. Outgoing uses `input` (dialed destination);
 * production V-Office outbound `clid` is the local SIP, not the client.
 */
export function resolveAtsClientPhone(payload: AtsWebhookPayload): AtsClientPhoneResolution {
  if (payload.calldirect === ATS_CALLDIRECT_OUTBOUND) {
    const input = presentWebhookString(payload.input);
    if (input) return { raw: input, source: 'input' };
    const clid = presentWebhookString(payload.clid);
    return clid ? { raw: clid, source: 'clid' } : { raw: null, source: 'none' };
  }
  const clid = presentWebhookString(payload.clid);
  return clid ? { raw: clid, source: 'clid' } : { raw: null, source: 'none' };
}
