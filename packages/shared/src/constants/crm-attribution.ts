/**
 * Marketing channels where CRM requires an explicit account/activity ("Which one").
 * Used by Lead/Deal attribution gate (API) and CRM UI (web).
 */
export const MARKETING_CHANNELS_REQUIRING_WHICH_ONE = [
  'LIST_AM',
  'GOOGLE_ADS',
  'META_ADS',
] as const;

const MARKETING_CHANNELS_REQUIRING_WHICH_ONE_SET = new Set<string>(
  MARKETING_CHANNELS_REQUIRING_WHICH_ONE,
);

/** Deal statuses in pipeline order (excludes FAILED; matches deal stage gate). */
export const DEAL_STAGE_GATE_ORDER = [
  'START_CONVERSATION',
  'DISCUSS_NEEDS',
  'MEETING',
  'CAN_WE_DO_IT',
  'SEND_OFFER',
  'GET_ANSWER',
  'DEPOSIT_AND_CONTRACT',
  'WON',
] as const;

export type DealStageGateKey = (typeof DEAL_STAGE_GATE_ORDER)[number];

export function requiresMarketingWhichOneSelection(
  source: string | null | undefined,
  sourceDetail: string | null | undefined,
): boolean {
  return (
    source === 'MARKETING' && MARKETING_CHANNELS_REQUIRING_WHICH_ONE_SET.has(sourceDetail ?? '')
  );
}

export function getDealStageGateIndex(status: string): number {
  return DEAL_STAGE_GATE_ORDER.indexOf(status as DealStageGateKey);
}

/** Attribution cannot be cleared once the deal is at or past Discuss needs. */
export function isDealAttributionLocked(status: string): boolean {
  const discussIdx = DEAL_STAGE_GATE_ORDER.indexOf('DISCUSS_NEEDS');
  const idx = getDealStageGateIndex(status);
  return idx >= discussIdx && discussIdx >= 0;
}

/** Lead attribution is optional only in New and Spam. */
export function isLeadAttributionLocked(status: string): boolean {
  return !['NEW', 'SPAM'].includes(status);
}
