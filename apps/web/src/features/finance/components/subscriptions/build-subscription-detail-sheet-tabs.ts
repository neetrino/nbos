import type { DetailSheetTabItem } from '@/components/shared';
import { SUBSCRIPTION_DETAIL_SHEET_TABS } from './subscription-detail-sheet-tabs';

interface BuildSubscriptionDetailSheetTabsOptions {
  canQuickCreateInvoice: boolean;
  onCreateInvoice: () => void;
}

/** Adds hover + on Invoices when the parent wires a real create handler. */
export function buildSubscriptionDetailSheetTabs(
  options: BuildSubscriptionDetailSheetTabsOptions,
): DetailSheetTabItem[] {
  return SUBSCRIPTION_DETAIL_SHEET_TABS.map((tab) => {
    if (tab.value === 'invoice' && options.canQuickCreateInvoice) {
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
