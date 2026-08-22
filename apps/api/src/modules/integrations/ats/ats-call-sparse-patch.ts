import { normalizeAtsCallerPhone } from './ats-phone.util';
import { isKnownAtsState, normalizeIncomingState } from './ats-call-state';
import { presentWebhookString } from './ats-webhook-field';
import type { AtsWebhookPayload } from './ats.types';

export type AtsCallSparsePatch = {
  state?: string;
  disposition?: string;
  billsec?: string;
  recordLink?: string;
  clid?: string;
  phone?: string;
  input?: string;
  calldirect?: string;
  op?: string;
  channel?: string;
  rate?: string;
};

/** Create/update data from present webhook strings only. Explicit empty/null is not written. */
export function buildSparseAtsCallPatch(payload: AtsWebhookPayload): AtsCallSparsePatch {
  const patch: AtsCallSparsePatch = {};
  assignPresentString(patch, 'disposition', payload.disposition);
  assignPresentString(patch, 'billsec', payload.billsec);
  assignPresentString(patch, 'recordLink', payload.recordLink);
  assignPresentString(patch, 'input', payload.input);
  assignPresentString(patch, 'calldirect', payload.calldirect);
  assignPresentString(patch, 'op', payload.op);
  assignPresentString(patch, 'channel', payload.channel);
  assignPresentString(patch, 'rate', payload.rate);
  assignClid(patch, payload.clid);
  assignState(patch, payload.state);
  return patch;
}

export function buildAtsCallCreateData(payload: AtsWebhookPayload): AtsCallSparsePatch & {
  uid: string;
} {
  return { uid: payload.uid, ...buildSparseAtsCallPatch(payload) };
}

function assignPresentString(
  patch: AtsCallSparsePatch,
  key: Exclude<keyof AtsCallSparsePatch, 'state' | 'phone'>,
  value: string | null | undefined,
): void {
  const present = presentWebhookString(value);
  if (present === undefined) return;
  patch[key] = present;
}

function assignClid(patch: AtsCallSparsePatch, clid: string | null | undefined): void {
  const present = presentWebhookString(clid);
  if (present === undefined) return;
  patch.clid = present;
  const phone = normalizeAtsCallerPhone(present);
  if (phone.success) {
    patch.phone = phone.e164;
  }
}

function assignState(patch: AtsCallSparsePatch, state: string | null | undefined): void {
  const present = presentWebhookString(state);
  if (present === undefined) return;
  const normalized = normalizeIncomingState(present);
  if (!isKnownAtsState(normalized)) return;
  patch.state = normalized;
}
