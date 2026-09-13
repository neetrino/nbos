import {
  NAV_MODULE_DEFINITIONS,
  isNavChildLink,
  type NavModuleDefinition,
  type PermissionRequirement,
} from './nav-config';
import { EXPLICIT_ROUTE_PERMISSIONS } from './route-permissions';

function matchesPath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function collectRoutePermissions(definitions: NavModuleDefinition[]): Array<{
  href: string;
  permission?: PermissionRequirement;
}> {
  const routes: Array<{ href: string; permission?: PermissionRequirement }> = [];

  for (const item of definitions) {
    routes.push({ href: item.href, permission: item.permission });
    for (const child of item.children ?? []) {
      if (!isNavChildLink(child)) continue;
      routes.push({
        href: child.href,
        permission: child.permission ?? item.permission,
      });
    }
  }

  return routes;
}

/**
 * Longest matching href wins (covers Settings children and nested module paths).
 * `EXPLICIT_ROUTE_PERMISSIONS` is checked first, so a route keeps its gate even when
 * the sidebar has no link for it or a parent module link carries no permission.
 */
export function resolveNavPermission(pathname: string): PermissionRequirement | undefined {
  const routes = [...EXPLICIT_ROUTE_PERMISSIONS, ...collectRoutePermissions(NAV_MODULE_DEFINITIONS)]
    .filter((route) => matchesPath(pathname, route.href))
    .sort((a, b) => b.href.length - a.href.length);

  return routes[0]?.permission;
}
