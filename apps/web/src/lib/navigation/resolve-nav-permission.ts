import {
  NAV_MODULE_DEFINITIONS,
  isNavChildLink,
  type NavModuleDefinition,
  type PermissionRequirement,
} from './nav-config';

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

/** Longest matching nav href wins (covers Settings children and nested module paths). */
export function resolveNavPermission(pathname: string): PermissionRequirement | undefined {
  const routes = collectRoutePermissions(NAV_MODULE_DEFINITIONS)
    .filter((route) => matchesPath(pathname, route.href))
    .sort((a, b) => b.href.length - a.href.length);

  return routes[0]?.permission;
}
