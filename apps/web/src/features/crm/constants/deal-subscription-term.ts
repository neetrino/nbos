/** Minimum fixed subscription term on PRODUCT/EXTENSION deals. */
export const DEAL_SUBSCRIPTION_TERM_MONTHS_MIN = 1;

/** Maximum fixed subscription term on PRODUCT/EXTENSION deals. */
export const DEAL_SUBSCRIPTION_TERM_MONTHS_MAX = 120;

/** Quick preset term lengths (months). */
const DEAL_SUBSCRIPTION_TERM_PRESET_SIX = 6;

const DEAL_SUBSCRIPTION_TERM_PRESET_TWELVE = 12;

export const DEAL_SUBSCRIPTION_TERM_PRESET_OPTIONS = [
  { value: String(DEAL_SUBSCRIPTION_TERM_PRESET_SIX), label: '6 mo' },
  { value: String(DEAL_SUBSCRIPTION_TERM_PRESET_TWELVE), label: '12 mo' },
] as const;
