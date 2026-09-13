import type { DetailSheetTabItem } from '@/components/shared';
import { CLIENT_SERVICE_DETAIL_SHEET_TABS } from './client-service-detail-sheet-tabs';

interface BuildClientServiceDetailSheetTabsOptions {
  canCreateInvoice: boolean;
  canCreateExpense: boolean;
  canCreateTask: boolean;
  onCreateInvoice: () => void;
  onCreateExpense: () => void;
  onCreateTask: () => void;
  tabLabel: (value: (typeof CLIENT_SERVICE_DETAIL_SHEET_TABS)[number]['value']) => string;
  createInvoiceAria: string;
  createExpenseAria: string;
  createTaskAria: string;
}

/** Adds hover + shortcuts for tabs that already expose in-panel Create actions. */
export function buildClientServiceDetailSheetTabs(
  options: BuildClientServiceDetailSheetTabsOptions,
): DetailSheetTabItem[] {
  return CLIENT_SERVICE_DETAIL_SHEET_TABS.map((tab) => {
    const labeled = { ...tab, label: options.tabLabel(tab.value) };
    if (tab.value === 'invoices' && options.canCreateInvoice) {
      return {
        ...labeled,
        quickCreate: {
          onCreate: options.onCreateInvoice,
          ariaLabel: options.createInvoiceAria,
        },
      };
    }
    if (tab.value === 'expenses' && options.canCreateExpense) {
      return {
        ...labeled,
        quickCreate: {
          onCreate: options.onCreateExpense,
          ariaLabel: options.createExpenseAria,
        },
      };
    }
    if (tab.value === 'tasks' && options.canCreateTask) {
      return {
        ...labeled,
        quickCreate: {
          onCreate: options.onCreateTask,
          ariaLabel: options.createTaskAria,
        },
      };
    }
    return labeled;
  });
}
