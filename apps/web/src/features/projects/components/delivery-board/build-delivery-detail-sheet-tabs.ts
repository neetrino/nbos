import { Gift, History, Kanban, LayoutGrid, Phone } from 'lucide-react';
import type { DetailSheetTabItem } from '@/components/shared';
import { DELIVERY_DETAIL_TABS } from './delivery-item-detail.constants';

const TAB_ICONS = {
  general: LayoutGrid,
  workspace: Kanban,
  calls: Phone,
  bonus: Gift,
  history: History,
} as const;

interface BuildDeliveryDetailSheetTabsOptions {
  canQuickCreateTask: boolean;
  onQuickCreateTask: () => void;
}

/** Adds hover + on Work Space when task create is allowed. */
export function buildDeliveryDetailSheetTabs(
  options: BuildDeliveryDetailSheetTabsOptions,
): DetailSheetTabItem[] {
  return DELIVERY_DETAIL_TABS.map((tab) => {
    const item: DetailSheetTabItem = {
      value: tab.id,
      label: tab.label,
      icon: TAB_ICONS[tab.id],
    };
    if (tab.id === 'workspace' && options.canQuickCreateTask) {
      return {
        ...item,
        quickCreate: {
          onCreate: options.onQuickCreateTask,
          ariaLabel: 'Create task',
        },
      };
    }
    return item;
  });
}
