/** ATS.am Active Call webhook constants (NBOS MVP). */

export const ATS_WEBHOOK_SUCCESS = { status: 'success' } as const;

export const ATS_CALLDIRECT_INBOUND = '0';
export const ATS_CALLDIRECT_OUTBOUND = '1';

export const ATS_STATE_START = 'start';
export const ATS_STATE_STATUS = 'status';
export const ATS_STATE_FINISH = 'finish';
export const ATS_STATE_END = 'end';

/** Lead.source for inbound ATS.am calls. */
export const ATS_LEAD_SOURCE = 'MARKETING' as const;

/**
 * Lead.sourceDetail for inbound ATS.am calls.
 * MarketingAccount mapping by DID (`input`) is TODO — not in this MVP.
 */
export const ATS_LEAD_SOURCE_DETAIL = 'ATS' as const;

export const ATS_TERMINAL_STATES = new Set<string>([ATS_STATE_FINISH, ATS_STATE_END]);

/** Local Call state after NBOS click-to-call, before ATS webhook. */
export const ATS_STATE_INITIATED = 'initiated';

export const ATS_CALL_SOURCE_CLICK_TO_CALL = 'CLICK_TO_CALL';

export const ATS_CALLBACK_ENDPOINT = 'https://account.ats.am/docs/api/v1/callback';
export const ATS_CALLBACK_TIMEOUT_MS = 15_000;

export const ATS_CLICK_TO_CALL_UID_PREFIX = 'ctc:';
export const ATS_CLICK_TO_CALL_RECONCILE_WINDOW_MS = 10 * 60 * 1000;
