import type { MobileDockItem, MobileDockSwitcherGroup } from './mobile-module-dock-types';
import {
  MOBILE_WORKSPACE_SWITCHER_CATEGORY_TITLE,
  MOBILE_WORKSPACE_SWITCHER_SECTION_TITLE,
  MOBILE_WORKSPACE_SWITCHER_VIEW_TITLE,
  MOBILE_WORKSPACE_SWITCHER_ZONE_TITLE,
} from './mobile-workspace-dock-constants';

export function pickActiveMobileDockItem(items: MobileDockItem[]): MobileDockItem | null {
  return items.find((item) => item.active) ?? items[0] ?? null;
}

export function resolveMobileDockSwitcher(
  pageItems: MobileDockItem[],
  headerItems: MobileDockItem[],
  secondaryItems: MobileDockItem[],
  fallbackItems: MobileDockItem[],
): { groups: MobileDockSwitcherGroup[]; displayItem: MobileDockItem | null } {
  const groups: MobileDockSwitcherGroup[] = [];

  if (headerItems.length > 0) {
    groups.push({
      id: 'zone',
      title: MOBILE_WORKSPACE_SWITCHER_ZONE_TITLE,
      items: headerItems,
    });
  }
  if (pageItems.length > 0) {
    groups.push({
      id: 'section',
      title: MOBILE_WORKSPACE_SWITCHER_SECTION_TITLE,
      items: pageItems,
    });
  }
  if (secondaryItems.length > 0) {
    groups.push({
      id: groups.length === 0 ? 'category' : 'view',
      title:
        groups.length === 0
          ? MOBILE_WORKSPACE_SWITCHER_CATEGORY_TITLE
          : MOBILE_WORKSPACE_SWITCHER_VIEW_TITLE,
      items: secondaryItems,
    });
  }
  if (groups.length === 0 && fallbackItems.length > 0) {
    groups.push({
      id: 'section',
      title: MOBILE_WORKSPACE_SWITCHER_SECTION_TITLE,
      items: fallbackItems,
    });
  }

  return {
    groups,
    displayItem:
      pickActiveMobileDockItem(pageItems) ??
      pickActiveMobileDockItem(headerItems) ??
      pickActiveMobileDockItem(secondaryItems) ??
      pickActiveMobileDockItem(fallbackItems),
  };
}

export function mobileDockItemsEqual(left: MobileDockItem[], right: MobileDockItem[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((item, index) => {
    const other = right[index];
    if (!other) return false;
    return (
      item.id === other.id &&
      item.label === other.label &&
      item.href === other.href &&
      item.active === other.active &&
      item.icon === other.icon
    );
  });
}
