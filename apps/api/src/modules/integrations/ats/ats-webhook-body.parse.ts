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

function readOptionalFormField(
  body: Record<string, unknown>,
  key: string,
): string | null | undefined {
  if (!Object.prototype.hasOwnProperty.call(body, key)) {
    return undefined;
  }
  return readFormString(body[key]);
}

/**
 * Parse ATS Active Call form fields from urlencoded or multipart body.
 * Unknown keys are ignored. Absent optional keys stay `undefined`.
 */
export function parseAtsWebhookBody(body: Record<string, unknown>): AtsWebhookPayload {
  const uid = readFormString(body['uid']);
  if (!uid) {
    throw new Error('UID_REQUIRED');
  }

  return {
    uid,
    lid: readOptionalFormField(body, 'lid'),
    state: readOptionalFormField(body, 'state'),
    input: readOptionalFormField(body, 'input'),
    clid: readOptionalFormField(body, 'clid'),
    op: readOptionalFormField(body, 'op'),
    rate: readOptionalFormField(body, 'rate'),
    billsec: readOptionalFormField(body, 'billsec'),
    calldirect: readOptionalFormField(body, 'calldirect'),
    disposition: readOptionalFormField(body, 'disposition'),
    channel: readOptionalFormField(body, 'channel'),
    recordLink: readOptionalFormField(body, 'record_link'),
  };
}
