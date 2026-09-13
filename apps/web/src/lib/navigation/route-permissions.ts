import {
  SETTINGS_MODULE,
  SETTINGS_RBAC_MODULE,
  SETTINGS_SCHEDULER_MODULE,
} from '@nbos/shared/constants';
import type { PermissionRequirement } from './nav-config';

export interface RoutePermissionEntry {
  href: string;
  permission: PermissionRequirement;
}

/**
 * Routes that must be permission-checked even when they are not sidebar links.
 *
 * The sidebar only hides links; this registry closes the URL. Every Settings / Admin
 * route is listed here so a direct address cannot reach an admin screen. Entries take
 * precedence over sidebar-derived permissions, and the longest matching path wins.
 *
 * Every route is checked against its own module, so a delegated section opens on its own
 * right: `/settings/audit-log` needs `AUDIT_LOGS VIEW` and the RBAC screens need
 * `SETTINGS_RBAC VIEW`. `SETTINGS.VIEW` gates the hub plus every section without a dedicated
 * module, and any `/settings` subpath that is not listed inherits it through prefix matching,
 * so a new page fails closed rather than open.
 */
export const EXPLICIT_ROUTE_PERMISSIONS: RoutePermissionEntry[] = [
  { href: '/settings', permission: { module: SETTINGS_MODULE, action: 'VIEW' } },
  { href: '/settings/appearance', permission: { module: SETTINGS_MODULE, action: 'EDIT' } },
  { href: '/settings/lists', permission: { module: SETTINGS_MODULE, action: 'VIEW' } },
  { href: '/settings/module-settings', permission: { module: SETTINGS_MODULE, action: 'VIEW' } },
  { href: '/settings/integrations', permission: { module: SETTINGS_MODULE, action: 'EDIT' } },
  { href: '/settings/security', permission: { module: SETTINGS_MODULE, action: 'EDIT' } },
  { href: '/settings/feature-flags', permission: { module: SETTINGS_MODULE, action: 'EDIT' } },
  { href: '/settings/trash-inventory', permission: { module: SETTINGS_MODULE, action: 'VIEW' } },
  { href: '/settings/roles', permission: { module: SETTINGS_RBAC_MODULE, action: 'VIEW' } },
  {
    href: '/settings/access-policies',
    permission: { module: SETTINGS_RBAC_MODULE, action: 'VIEW' },
  },
  {
    href: '/settings/scheduler',
    permission: { module: SETTINGS_SCHEDULER_MODULE, action: 'VIEW' },
  },
  { href: '/settings/audit-log', permission: { module: 'AUDIT_LOGS', action: 'VIEW' } },
];
