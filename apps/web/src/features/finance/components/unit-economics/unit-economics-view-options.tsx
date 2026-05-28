import {
  ArrowDownCircle,
  Banknote,
  LayoutGrid,
  List,
  PieChart,
  Rows3,
  TrendingUp,
} from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { UnitEconomicsBoardViewMode } from '@/features/finance/constants/unit-economics-board-view';

export const UNIT_ECONOMICS_VIEW_OPTIONS: ViewModeOption<UnitEconomicsBoardViewMode>[] = [
  {
    value: 'list',
    label: 'By unit',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Delivery units list',
  },
  {
    value: 'cards',
    label: 'Cards',
    icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Delivery units cards',
  },
  {
    value: 'projects',
    label: 'Project',
    icon: <Rows3 className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Roll-up by project',
  },
  {
    value: 'products',
    label: 'Product',
    icon: <PieChart className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Roll-up by product',
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
