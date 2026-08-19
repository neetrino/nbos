import type { DetailSheetTabItem } from '@/components/shared';

interface BuildDealDetailSheetTabsOptions {
  canCreateInvoice: boolean;
  canCreateTask: boolean;
  onCreateInvoice: () => void;
  onCreateTask: () => void;
}

/** Adds hover + on Deal Invoice / Task tabs when create is allowed. */
export function buildDealDetailSheetTabs(
  baseTabs: readonly DetailSheetTabItem[],
  options: BuildDealDetailSheetTabsOptions,
): DetailSheetTabItem[] {
  return baseTabs.map((tab) => {
    if (tab.value === 'invoice' && options.canCreateInvoice) {
      return {
        ...tab,
        quickCreate: {
          onCreate: options.onCreateInvoice,
          ariaLabel: 'Create invoice',
        },
      };
    }
    if (tab.value === 'task' && options.canCreateTask) {
      return {
        ...tab,
        quickCreate: {
          onCreate: options.onCreateTask,
          ariaLabel: 'Create task',
        },
      };
    }
    return tab;
  });
}
