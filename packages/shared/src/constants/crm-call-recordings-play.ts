/** Extra CRM capability: play a confidential call recording. Key = module_action. */
export const CRM_CALL_RECORDINGS_MODULE = 'CRM_CALL_RECORDINGS' as const;
export const CRM_CALL_RECORDINGS_PLAY_ACTION = 'PLAY' as const;
export const CRM_CALL_RECORDINGS_PLAY_PERMISSION =
  `${CRM_CALL_RECORDINGS_MODULE}_${CRM_CALL_RECORDINGS_PLAY_ACTION}` as const;
export const CRM_CALL_RECORDINGS_PLAY_PERMISSION_ID = 'perm-crm-call-recordings-play' as const;

/** Scope stored on RolePermission; object-level Call + Drive policies still apply. */
export const CRM_CALL_RECORDINGS_PLAY_DEFAULT_SCOPE = 'ALL' as const;

/**
 * Default system roles that receive `CRM_CALL_RECORDINGS_PLAY`.
 * Marketing (`role-marketing`, `role-head-marketing`) is omitted on purpose.
 */
export const CRM_CALL_RECORDINGS_PLAY_DEFAULT_ROLE_IDS = [
  'role-owner',
  'role-ceo',
  'role-seller',
  'role-head-sales',
] as const;

export const CRM_CALL_RECORDINGS_PLAY_DEFAULT_ROLE_SLUGS = [
  'owner',
  'ceo',
  'seller',
  'head-sales',
] as const;
