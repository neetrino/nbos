import type { AtsWebhookPayload } from './ats.types';

function readFormString(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

/**
 * Parse ATS Active Call form fields from urlencoded or multipart body.
 * Unknown keys are ignored (ATS may add fields without breaking ingestion).
 */
export function parseAtsWebhookBody(body: Record<string, unknown>): AtsWebhookPayload {
  const uid = readFormString(body['uid']);
  if (!uid) {
    throw new Error('UID_REQUIRED');
  }

  return {
    uid,
    state: readFormString(body['state']),
    input: readFormString(body['input']),
    clid: readFormString(body['clid']),
    op: readFormString(body['op']),
    rate: readFormString(body['rate']),
    billsec: readFormString(body['billsec']),
    calldirect: readFormString(body['calldirect']),
    disposition: readFormString(body['disposition']),
    channel: readFormString(body['channel']),
    recordLink: readFormString(body['record_link']),
  };
}
