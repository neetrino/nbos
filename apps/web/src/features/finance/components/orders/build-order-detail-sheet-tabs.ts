import type { DetailSheetTabItem } from '@/components/shared';
import { ORDER_DETAIL_SHEET_TABS } from './order-detail-sheet-tabs';

interface BuildOrderDetailSheetTabsOptions {
  canQuickCreateInvoice: boolean;
  onCreateInvoice: () => void;
}

/** Adds hover + on Invoices when the parent wires a real create handler. */
export function buildOrderDetailSheetTabs(
  options: BuildOrderDetailSheetTabsOptions,
): DetailSheetTabItem[] {
  return ORDER_DETAIL_SHEET_TABS.map((tab) => {
    if (tab.value === 'invoices' && options.canQuickCreateInvoice) {
      return {
        ...tab,
        quickCreate: {
          onCreate: options.onCreateInvoice,
          ariaLabel: 'Create invoice',
        },
      };
    }
    return tab;
  });
}
