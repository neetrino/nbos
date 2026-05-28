'use client';

import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  unitEconomicsApi,
  type UnitEconomicsList,
  type UnitEconomicsProductRollup,
  type UnitEconomicsProjectRollup,
  type UnitEconomicsRow,
} from '@/lib/api/unit-economics';

export function useUnitEconomicsList() {
  const [items, setItems] = useState<UnitEconomicsRow[]>([]);
  const [projects, setProjects] = useState<UnitEconomicsProjectRollup[]>([]);
  const [products, setProducts] = useState<UnitEconomicsProductRollup[]>([]);
  const [totals, setTotals] = useState<UnitEconomicsList['totals'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await unitEconomicsApi.list();
      setItems(data.items);
      setProjects(data.projects ?? []);
      setProducts(data.products ?? []);
      setTotals(data.totals);
    } catch (caught) {
      setItems([]);
      setProjects([]);
      setProducts([]);
      setTotals(null);
      setError(getApiErrorMessage(caught, 'Unit economics could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, projects, products, totals, loading, error, reload: load };
}
