import type { HeaderNavItem } from './header-context-types';

export function isHeaderNavItemActive(pathname: string, item: HeaderNavItem): boolean {
  if (item.isActive) {
    return item.isActive(pathname);
  }

  const prefix = item.matchPrefix ?? item.href;
  const excluded =
    item.excludeMatchPrefix !== undefined && pathname.startsWith(item.excludeMatchPrefix);
  if (excluded) {
    return false;
  }
  if (item.exactMatch) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${prefix}/`);
}
