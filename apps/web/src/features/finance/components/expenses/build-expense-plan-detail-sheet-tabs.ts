import type { DetailSheetTabItem } from '@/components/shared';
import { EXPENSE_PLAN_DETAIL_SHEET_TABS } from './expense-plan-detail-sheet-tabs';

interface BuildExpensePlanDetailSheetTabsOptions {
  canCreateCard: boolean;
  onCreateCard: () => void;
  tabLabel: (value: (typeof EXPENSE_PLAN_DETAIL_SHEET_TABS)[number]['value']) => string;
  createAriaLabel: string;
}

/** Adds hover + on Cards when the parent wires free-form create. */
export function buildExpensePlanDetailSheetTabs(
  options: BuildExpensePlanDetailSheetTabsOptions,
): DetailSheetTabItem[] {
  return EXPENSE_PLAN_DETAIL_SHEET_TABS.map((tab) => {
    const labeled = { ...tab, label: options.tabLabel(tab.value) };
    if (tab.value === 'cards' && options.canCreateCard) {
      return {
        ...labeled,
        quickCreate: {
          onCreate: options.onCreateCard,
          ariaLabel: options.createAriaLabel,
        },
      };
    }
    return labeled;
  });
}
