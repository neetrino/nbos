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
  loading: boolean;
  error: string | null;
  reload: () => void;
};
