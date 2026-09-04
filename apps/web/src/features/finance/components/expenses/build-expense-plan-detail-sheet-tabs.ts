import type { DetailSheetTabItem } from '@/components/shared';
import { EXPENSE_PLAN_DETAIL_SHEET_TABS } from './expense-plan-detail-sheet-tabs';

interface BuildExpensePlanDetailSheetTabsOptions {
  canGenerateCard: boolean;
  onGenerateCard: () => void;
}

/** Adds hover + on Cards when the parent wires generate. */
export function buildExpensePlanDetailSheetTabs(
  options: BuildExpensePlanDetailSheetTabsOptions,
): DetailSheetTabItem[] {
  return EXPENSE_PLAN_DETAIL_SHEET_TABS.map((tab) => {
    if (tab.value === 'cards' && options.canGenerateCard) {
      return {
        ...tab,
        quickCreate: {
          onCreate: options.onGenerateCard,
          ariaLabel: 'Generate expense card',
        },
      };
    }
    return tab;
  });
}
