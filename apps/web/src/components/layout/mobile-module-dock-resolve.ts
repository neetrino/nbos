import { MOBILE_DOCK_CONTENT_SLOTS, type MobileDockItem } from './mobile-module-dock-types';

export function mergeMobileDockItems(
  pageItems: MobileDockItem[],
  secondaryItems: MobileDockItem[],
  headerItems: MobileDockItem[],
): MobileDockItem[] {
  const seen = new Set<string>();
  const merged: MobileDockItem[] = [];
  for (const item of [...pageItems, ...headerItems, ...secondaryItems]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
}

export function resolveMobileDockSlots(items: MobileDockItem[]): {
  slots: MobileDockItem[];
  overflow: MobileDockItem[];
} {
  if (items.length <= MOBILE_DOCK_CONTENT_SLOTS) {
    return { slots: items, overflow: [] };
  }

  return {
    slots: items.slice(0, MOBILE_DOCK_CONTENT_SLOTS - 1),
    overflow: items.slice(MOBILE_DOCK_CONTENT_SLOTS - 1),
  };
}

export function mobileDockItemsEqual(left: MobileDockItem[], right: MobileDockItem[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((item, index) => {
    const other = right[index];
    return (
      item.id === other.id &&
      item.label === other.label &&
      item.href === other.href &&
      item.active === other.active &&
      item.icon === other.icon
    );
  });
}
