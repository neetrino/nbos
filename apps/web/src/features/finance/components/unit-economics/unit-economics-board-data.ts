import type { UnitEconomicsFilteredTotals } from '@/features/finance/components/unit-economics/compute-unit-economics-filtered-totals';
import type {
  UnitEconomicsList,
  UnitEconomicsProductRollup,
  UnitEconomicsProjectRollup,
  UnitEconomicsRow,
} from '@/lib/api/unit-economics';

export type UnitEconomicsBoardData = {
  items: UnitEconomicsRow[];
  projects: UnitEconomicsProjectRollup[];
  products: UnitEconomicsProductRollup[];
  totals: UnitEconomicsList['totals'] | null;
  filteredTotals: UnitEconomicsFilteredTotals;
  loading: boolean;
  error: string | null;
  reload: () => void;
};
