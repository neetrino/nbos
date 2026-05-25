import {
  DEFAULT_SIDEBAR_MODULE_ORDER,
  SIDEBAR_MODULE_KEYS_NON_HIDABLE,
  type SidebarModuleKey,
} from '@nbos/shared/constants';
import type { NavModuleDefinition } from './nav-config';

export interface SidebarNavigationLayout {
  primary: NavModuleDefinition[];
  hidden: NavModuleDefinition[];
}

export function applySidebarPreferences(
  visibleModules: NavModuleDefinition[],
  sidebarModuleOrder: string[],
  hiddenSidebarModules: string[],
): SidebarNavigationLayout {
  const visibleByKey = new Map(visibleModules.map((item) => [item.key, item]));
  const visibleKeys = visibleModules.map((item) => item.key);
  const orderedKeys = resolveSidebarModuleOrder(sidebarModuleOrder, visibleKeys);
  const hiddenSet = new Set(
    hiddenSidebarModules.filter(
      (key): key is SidebarModuleKey =>
        visibleByKey.has(key as SidebarModuleKey) &&
        !SIDEBAR_MODULE_KEYS_NON_HIDABLE.includes(key as SidebarModuleKey),
    ),
  );

  const primary: NavModuleDefinition[] = [];
  const hidden: NavModuleDefinition[] = [];

  for (const key of orderedKeys) {
    const item = visibleByKey.get(key);
    if (!item) continue;
    if (hiddenSet.has(key)) {
      hidden.push(item);
    } else {
      primary.push(item);
    }
  }

  return { primary, hidden };
}

export function resolveSidebarModuleOrder(
  savedOrder: string[],
  visibleKeys: readonly SidebarModuleKey[],
): SidebarModuleKey[] {
  const visibleSet = new Set<string>(visibleKeys);
  const ordered: SidebarModuleKey[] = [];
  const seen = new Set<string>();

  for (const key of savedOrder) {
    if (visibleSet.has(key) && !seen.has(key)) {
      ordered.push(key as SidebarModuleKey);
      seen.add(key);
    }
  }

  for (const key of DEFAULT_SIDEBAR_MODULE_ORDER) {
    if (visibleSet.has(key) && !seen.has(key)) {
      ordered.push(key);
      seen.add(key);
    }
  }

  return ordered;
}
