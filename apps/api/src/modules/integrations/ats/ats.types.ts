export type AtsCallState = 'start' | 'status' | 'finish' | 'end';

export type AtsCallDirect = '0' | '1';

export type AtsDisposition = 'ANSWERED' | 'NO ANSWER';

/** Normalized Active Call payload after form parsing. */
export interface AtsWebhookPayload {
  state: string | null;
  uid: string;
  input: string | null;
  clid: string | null;
  op: string | null;
  rate: string | null;
  billsec: string | null;
  calldirect: string | null;
  disposition: string | null;
  channel: string | null;
  recordLink: string | null;
}

export interface AtsWebhookSuccessResponse {
  status: 'success';
}
