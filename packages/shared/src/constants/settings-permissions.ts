/**
 * Settings / Admin RBAC modules.
 *
 * Deliberately separate from `COMPANY`, which belongs to My Company (departments,
 * employees, seats, KPI/bonus/compensation policies). Platform administration must
 * not ride along with business-structure permissions.
 *
 * Canon: `docs/NBOS/02-Modules/16-Settings-Admin/02-Permissions-RBAC.md`.
 */

/** Platform configuration: General, Appearance, System Lists, Module Settings, Integrations, Security, Feature Flags, Trash inventory. */
export const SETTINGS_MODULE = 'SETTINGS' as const;

/** Permission roles, the permission matrix, and Platform Access Foundation levels. */
export const SETTINGS_RBAC_MODULE = 'SETTINGS_RBAC' as const;

/** Platform cron/time job catalog: enable, disable, run now. */
export const SETTINGS_SCHEDULER_MODULE = 'SETTINGS_SCHEDULER' as const;

export const SETTINGS_PERMISSION_MODULES = [
  SETTINGS_MODULE,
  SETTINGS_RBAC_MODULE,
  SETTINGS_SCHEDULER_MODULE,
] as const;

export type SettingsPermissionModule = (typeof SETTINGS_PERMISSION_MODULES)[number];

/**
 * Roles holding Settings modules by default: Platform Owner / Founder (legacy `owner`)
 * and CEO. Every other role starts at `NONE` and is granted explicitly in
 * Settings → Permissions / RBAC.
 */
export const SETTINGS_DEFAULT_ROLE_IDS = ['role-owner', 'role-ceo'] as const;

export const SETTINGS_DEFAULT_ROLE_SLUGS = ['owner', 'ceo'] as const;

export const SETTINGS_DEFAULT_SCOPE = 'ALL' as const;
