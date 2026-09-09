import type { SidebarModuleKey } from '@nbos/shared/constants';

export const MOBILE_DOCK_PREFERRED_KEYS: SidebarModuleKey[] = [
  'dashboard',
  'crm',
  'tasks',
  'messenger',
];

export const MOBILE_DOCK_FALLBACK_KEYS: SidebarModuleKey[] = ['finance', 'calendar', 'support'];

export const MOBILE_DOCK_MAX_PRIMARY = 4;

export const MOBILE_DOCK_HEIGHT_CLASS = 'h-14';

export const MOBILE_DOCK_ITEM_CLASS =
  'flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-semibold tracking-wide';

export function pickMobileDockKeys(visibleKeys: SidebarModuleKey[]): SidebarModuleKey[] {
  const preferred = MOBILE_DOCK_PREFERRED_KEYS.filter((key) => visibleKeys.includes(key));
  if (preferred.length >= MOBILE_DOCK_MAX_PRIMARY) {
    return preferred.slice(0, MOBILE_DOCK_MAX_PRIMARY);
  }

  const extras = MOBILE_DOCK_FALLBACK_KEYS.filter(
    (key) => visibleKeys.includes(key) && !preferred.includes(key),
  );
  return [...preferred, ...extras].slice(0, MOBILE_DOCK_MAX_PRIMARY);
}
