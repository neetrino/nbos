export type AtsCallState = 'start' | 'status' | 'finish' | 'end';

export type AtsCallDirect = '0' | '1';

export type AtsDisposition = 'ANSWERED' | 'NO ANSWER';

/**
 * Normalized Active Call payload after form parsing.
 * Optional fields use `undefined` when the key was absent (do not change)
 * and `null` when ATS sent an explicit empty value.
 */
export interface AtsWebhookPayload {
  uid: string;
  state?: string | null;
  input?: string | null;
  clid?: string | null;
  op?: string | null;
  rate?: string | null;
  billsec?: string | null;
  calldirect?: string | null;
  disposition?: string | null;
  channel?: string | null;
  recordLink?: string | null;
}

export interface AtsWebhookSuccessResponse {
  status: 'success';
  /** ATS.am SIP ID — only when inbound start matched a known Contact/Lead assignee. */
  redirect_call?: string;
}
