import type { DetailSheetTabItem } from '@/components/shared';
import { CLIENT_SERVICE_DETAIL_SHEET_TABS } from './client-service-detail-sheet-tabs';

interface BuildClientServiceDetailSheetTabsOptions {
  canCreateInvoice: boolean;
  canCreateExpense: boolean;
  canCreateTask: boolean;
  onCreateInvoice: () => void;
  onCreateExpense: () => void;
  onCreateTask: () => void;
}

/** Adds hover + shortcuts for tabs that already expose in-panel Create actions. */
export function buildClientServiceDetailSheetTabs(
  options: BuildClientServiceDetailSheetTabsOptions,
): DetailSheetTabItem[] {
  return CLIENT_SERVICE_DETAIL_SHEET_TABS.map((tab) => {
    if (tab.value === 'invoices' && options.canCreateInvoice) {
      return {
        ...tab,
        quickCreate: {
          onCreate: options.onCreateInvoice,
          ariaLabel: 'Create invoice',
        },
      };
    }
    if (tab.value === 'expenses' && options.canCreateExpense) {
      return {
        ...tab,
        quickCreate: {
          onCreate: options.onCreateExpense,
          ariaLabel: 'Create expense',
        },
      };
    }
    if (tab.value === 'tasks' && options.canCreateTask) {
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
