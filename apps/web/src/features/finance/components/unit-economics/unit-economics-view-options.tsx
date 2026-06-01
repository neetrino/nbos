import { ArrowDownCircle, Banknote, GitBranch, LayoutGrid, List, TrendingUp } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { UnitEconomicsBoardViewMode } from '@/features/finance/constants/unit-economics-board-view';

export const UNIT_ECONOMICS_VIEW_OPTIONS: ViewModeOption<UnitEconomicsBoardViewMode>[] = [
  {
    value: 'tree',
    label: 'Hierarchy',
    icon: <GitBranch className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Project product order hierarchy',
  },
  {
    value: 'orders',
    label: 'Orders',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Flat order list',
  },
  {
    value: 'cards',
    label: 'Cards',
    icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Delivery units cards',
  },
  {
    value: 'cash',
    label: 'Cash',
    icon: <Banknote className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Cash and funding',
  },
  {
    value: 'outflows',
    label: 'Outflows',
    icon: <ArrowDownCircle className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Money out',
  },
  {
    value: 'profitability',
    label: 'Margin',
    icon: <TrendingUp className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Profitability',
  },
];
