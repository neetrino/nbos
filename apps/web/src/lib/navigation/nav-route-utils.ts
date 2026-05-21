import { isNavChildLink, type NavModuleDefinition } from './nav-config';

export function getPathFromHref(href: string): string {
  return href.split('?')[0] ?? href;
}

export function isChildRouteActive(pathname: string, childHref: string): boolean {
  const path = getPathFromHref(childHref);
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function getFirstChildHref(item: NavModuleDefinition): string {
  const firstLink = item.children?.find((child) => isNavChildLink(child));
  return firstLink?.href ?? item.href;
}
