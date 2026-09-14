/** Profile photos are small; keep them well under the Drive 100 MB cap. */
export const EMPLOYEE_AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export const EMPLOYEE_AVATAR_ENTITY_TYPE = 'EMPLOYEE';

export const EMPLOYEE_AVATAR_SOURCE_MODULE = 'EMPLOYEES';

export const EMPLOYEE_AVATAR_CACHE_CONTROL = 'private, max-age=86400';

export const EMPLOYEE_AVATAR_ACCEPT_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type EmployeeAvatarMime = (typeof EMPLOYEE_AVATAR_ACCEPT_MIME)[number];
