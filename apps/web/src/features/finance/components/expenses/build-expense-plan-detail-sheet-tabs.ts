import type { DetailSheetTabItem } from '@/components/shared';
import { EXPENSE_PLAN_DETAIL_SHEET_TABS } from './expense-plan-detail-sheet-tabs';

interface BuildExpensePlanDetailSheetTabsOptions {
  canGenerateCard: boolean;
  onGenerateCard: () => void;
  tabLabel: (value: (typeof EXPENSE_PLAN_DETAIL_SHEET_TABS)[number]['value']) => string;
  generateAriaLabel: string;
}

/** Adds hover + on Cards when the parent wires generate. */
export function buildExpensePlanDetailSheetTabs(
  options: BuildExpensePlanDetailSheetTabsOptions,
): DetailSheetTabItem[] {
  return EXPENSE_PLAN_DETAIL_SHEET_TABS.map((tab) => {
    const labeled = { ...tab, label: options.tabLabel(tab.value) };
    if (tab.value === 'cards' && options.canGenerateCard) {
      return {
        ...labeled,
        quickCreate: {
          onCreate: options.onGenerateCard,
          ariaLabel: options.generateAriaLabel,
        },
      };
    }
    return labeled;
  });
}
