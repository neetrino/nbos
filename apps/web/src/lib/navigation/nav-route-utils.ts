import type { NavModuleDefinition } from './nav-config';

export function getPathFromHref(href: string): string {
  return href.split('?')[0] ?? href;
}

export function isChildRouteActive(pathname: string, childHref: string): boolean {
  const path = getPathFromHref(childHref);
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function getFirstChildHref(item: NavModuleDefinition): string {
  return item.children?.[0]?.href ?? item.href;
}
