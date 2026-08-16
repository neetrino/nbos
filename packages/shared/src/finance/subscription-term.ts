/**
 * Bounds of a fixed subscription term, counted in covered months.
 * Shared so the deal gate, the subscription DTO and the deal form cannot drift apart.
 */
export const SUBSCRIPTION_TERM_MONTHS_MIN = 1;

export const SUBSCRIPTION_TERM_MONTHS_MAX = 120;
