/** Extra Calls capability: play a confidential call recording. Key = module_action. */
export const CALLS_MODULE = 'CALLS' as const;
export const CALLS_PLAY_ACTION = 'PLAY' as const;
export const CALLS_PLAY_PERMISSION = `${CALLS_MODULE}_${CALLS_PLAY_ACTION}` as const;
export const CALLS_PLAY_PERMISSION_ID = 'perm-calls-play' as const;
export const CALLS_VIEW_PERMISSION = `${CALLS_MODULE}_VIEW` as const;

/** Scope stored on RolePermission; object-level Call + Drive policies still apply. */
export const CALLS_PLAY_DEFAULT_SCOPE = 'ALL' as const;

/**
 * Default system roles that receive `CALLS_PLAY` and `CALLS_VIEW`.
 * Delivery, Marketing, and HR stay NONE until granted in Settings → Roles.
 */
export const CALLS_PLAY_DEFAULT_ROLE_IDS = [
  'role-owner',
  'role-ceo',
  'role-seller',
  'role-head-sales',
] as const;

export const CALLS_PLAY_DEFAULT_ROLE_SLUGS = ['owner', 'ceo', 'seller', 'head-sales'] as const;
