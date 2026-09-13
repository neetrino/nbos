import {
  DEFAULT_SIDEBAR_MODULE_ORDER,
  SIDEBAR_MODULE_KEYS_NON_HIDABLE,
  type SidebarModuleKey,
} from '@nbos/shared/constants';
import { isFooterSidebarModule, type NavModuleDefinition } from './nav-config';

export interface SidebarNavigationLayout {
  primary: NavModuleDefinition[];
  hidden: NavModuleDefinition[];
}

/** Settings stays pinned in the footer; child routes are for access gates only. */
export function toSidebarListModule(item: NavModuleDefinition): NavModuleDefinition {
  return {
    key: item.key,
    label: item.label,
    href: item.href,
    permission: item.permission,
    quickAction: item.quickAction,
  };
}

export function getSidebarFooterModule(
  visibleModules: NavModuleDefinition[],
): NavModuleDefinition | null {
  return visibleModules.find(isFooterSidebarModule) ?? null;
}

export function applySidebarPreferences(
  visibleModules: NavModuleDefinition[],
  sidebarModuleOrder: string[],
  hiddenSidebarModules: string[],
): SidebarNavigationLayout {
  const listModules = visibleModules.filter((item) => !isFooterSidebarModule(item));
  const visibleByKey = new Map(listModules.map((item) => [item.key, toSidebarListModule(item)]));
  const visibleKeys = listModules.map((item) => item.key);
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

  return placeAiAgentsBeforeReports(ordered);
}

/** Product default: AI & Agents sits immediately above Analytics. */
export function placeAiAgentsBeforeReports(order: readonly SidebarModuleKey[]): SidebarModuleKey[] {
  const reportsIndex = order.indexOf('reports');
  const aiIndex = order.indexOf('ai-agents');
  if (reportsIndex < 0 || aiIndex < 0 || aiIndex < reportsIndex) {
    return [...order];
  }
  const next: SidebarModuleKey[] = order.filter((key) => key !== 'ai-agents');
  const insertAt = next.indexOf('reports');
  next.splice(insertAt, 0, 'ai-agents');
  return next;
}
