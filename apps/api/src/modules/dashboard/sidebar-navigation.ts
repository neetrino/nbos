import {
  DEFAULT_SIDEBAR_MODULE_ORDER,
  SIDEBAR_MODULE_KEYS,
  SIDEBAR_MODULE_KEYS_NON_HIDABLE,
  type SidebarModuleKey,
} from '@nbos/shared';

export { SIDEBAR_MODULE_KEYS, SIDEBAR_MODULE_MAX_COUNT } from '@nbos/shared';

export function sanitizeSidebarModuleOrder(values: string[]): SidebarModuleKey[] {
  return sanitizeSidebarKeys(values, SIDEBAR_MODULE_KEYS);
}

export function sanitizeHiddenSidebarModules(values: string[]): SidebarModuleKey[] {
  const nonHidable = new Set<string>(SIDEBAR_MODULE_KEYS_NON_HIDABLE);
  return sanitizeSidebarKeys(values, SIDEBAR_MODULE_KEYS).filter((key) => !nonHidable.has(key));
}

export function resolveSidebarModuleOrder(
  savedOrder: string[],
  visibleKeys: readonly SidebarModuleKey[],
): SidebarModuleKey[] {
  const visibleSet = new Set<string>(visibleKeys);
  const ordered: SidebarModuleKey[] = [];
  const seen = new Set<string>();

  for (const key of sanitizeSidebarModuleOrder(savedOrder)) {
    if (visibleSet.has(key) && !seen.has(key)) {
      ordered.push(key);
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

function sanitizeSidebarKeys<const T extends readonly string[]>(
  values: string[],
  allowed: T,
): Array<T[number]> {
  const allowedSet = new Set<string>(allowed);
  const uniqueValues = new Set(values);
  return [...uniqueValues].filter((value): value is T[number] => allowedSet.has(value));
}
