/**
 * Video Meetings (Module 22) RBAC — dedicated module, never reuse CALLS.
 *
 * Actions match the platform catalog: VIEW / EDIT / ADD / DELETE.
 * Canon fine-grained verbs (JOIN / HOST / RECORD / PLAY_RECORDING / MANAGE_LINKS)
 * map onto these in API layers in later slices; do not invent a second RBAC system.
 *
 * Default role matrix beyond Owner/CEO is a DECISION still open for Product+Security.
 * Seed/migration grant only Owner and CEO (ALL) until that decision lands.
 *
 * Canon: `docs/NBOS/02-Modules/22-Video-Meetings/04-Access-Consent-and-Recording-Policy.md`.
 */

export const VIDEO_MEETINGS_MODULE = 'VIDEO_MEETINGS' as const;

export const VIDEO_MEETINGS_VIEW = `${VIDEO_MEETINGS_MODULE}_VIEW` as const;
export const VIDEO_MEETINGS_EDIT = `${VIDEO_MEETINGS_MODULE}_EDIT` as const;
export const VIDEO_MEETINGS_ADD = `${VIDEO_MEETINGS_MODULE}_ADD` as const;
export const VIDEO_MEETINGS_DELETE = `${VIDEO_MEETINGS_MODULE}_DELETE` as const;

/** Stable `permissions.id` rows; matches seed-rbac `perm-${module}-${action}` ids. */
export const VIDEO_MEETINGS_VIEW_PERMISSION_ID = 'perm-video-meetings-view' as const;
export const VIDEO_MEETINGS_EDIT_PERMISSION_ID = 'perm-video-meetings-edit' as const;
export const VIDEO_MEETINGS_ADD_PERMISSION_ID = 'perm-video-meetings-add' as const;
export const VIDEO_MEETINGS_DELETE_PERMISSION_ID = 'perm-video-meetings-delete' as const;

/**
 * Interim default grants: Owner and CEO only (broad admin/owner).
 * Product+Security must approve any wider production matrix.
 */
export const VIDEO_MEETINGS_DEFAULT_ROLE_IDS = ['role-owner', 'role-ceo'] as const;

export const VIDEO_MEETINGS_DEFAULT_ROLE_SLUGS = ['owner', 'ceo'] as const;
