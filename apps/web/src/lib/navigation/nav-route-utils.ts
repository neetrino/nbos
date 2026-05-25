import type { SidebarModuleKey } from '@nbos/shared/constants';
import {
  isPathInModuleSection,
  isRegisteredModuleKey,
  readModuleEntryHref,
} from '@/lib/navigation/module-last-visit';
import {
  isNavChildLink,
  type NavChildLinkDefinition,
  type NavModuleDefinition,
} from './nav-config';

export function getPathFromHref(href: string): string {
  return href.split('?')[0] ?? href;
}

export function isChildRouteActive(pathname: string, childHref: string): boolean {
  const path = getPathFromHref(childHref);
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function isNavChildLinkActive(
  pathname: string,
  child: NavChildLinkDefinition,
  moduleKey: SidebarModuleKey,
): boolean {
  if (child.navSection && isRegisteredModuleKey(moduleKey)) {
    return isPathInModuleSection(moduleKey, pathname, child.navSection);
  }
  return isChildRouteActive(pathname, child.href);
}

export function getModuleNavHref(item: NavModuleDefinition): string {
  if (isRegisteredModuleKey(item.key)) {
    return readModuleEntryHref(item.key);
  }
  return item.href;
}

export function getFirstChildHref(item: NavModuleDefinition): string {
  if (isRegisteredModuleKey(item.key)) {
    return readModuleEntryHref(item.key);
  }
  const firstLink = item.children?.find((child) => isNavChildLink(child));
  return firstLink?.href ?? item.href;
}
