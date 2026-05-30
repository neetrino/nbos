import { Banknote, FileText, Gift, Receipt } from 'lucide-react';
import type { DetailSheetTabItem } from '@/components/shared';
import type { UnitEconomicsOrderDetail } from '@/lib/api/unit-economics';

export function buildUnitEconomicsDrilldownTabs(
  detail: UnitEconomicsOrderDetail,
): DetailSheetTabItem[] {
  return [
    { value: 'invoices', label: `Invoices (${detail.invoices.length})`, icon: FileText },
    { value: 'payments', label: `Payments (${detail.payments.length})`, icon: Banknote },
    { value: 'expenses', label: `Expenses (${detail.expenses.length})`, icon: Receipt },
    { value: 'bonuses', label: `Bonuses (${detail.bonuses.length})`, icon: Gift },
  ];
}
