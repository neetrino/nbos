/** Break-glass grant lifetime (24 hours). */
export const EMERGENCY_ACCESS_TTL_MS = 24 * 60 * 60 * 1000;

export const EMERGENCY_ACCESS_REASON_MIN_LENGTH = 10;

export const EMERGENCY_ACCESS_ROLE_SLUGS = ['ceo', 'admin', 'owner'] as const;

export const EMERGENCY_ACCESS_REASON_PREFIX = 'emergency:';
