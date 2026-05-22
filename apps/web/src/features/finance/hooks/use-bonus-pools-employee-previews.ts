'use client';

import { useEffect, useState } from 'react';
import { BONUS_POOL_EMPLOYEE_CSV_MAX_POOLS } from '@/features/finance/constants/bonus-pool-csv-export';
import { bonusesApi, type BonusPoolEmployeeLine, type BonusProductPoolRow } from '@/lib/api/bonus';

export function useBonusPoolsEmployeePreviews(
  rows: readonly BonusProductPoolRow[],
  enabled: boolean,
): {
  linesByPoolKey: Map<string, BonusPoolEmployeeLine[]>;
  loading: boolean;
} {
  const [linesByPoolKey, setLinesByPoolKey] = useState<Map<string, BonusPoolEmployeeLine[]>>(
    () => new Map(),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || rows.length === 0) {
      setLinesByPoolKey(new Map());
      return;
    }

    const slice = rows.slice(0, BONUS_POOL_EMPLOYEE_CSV_MAX_POOLS);
    const poolKeys = slice.map((r) => r.poolKey).join(',');

    let cancelled = false;
    setLoading(true);

    void bonusesApi
      .getProductPoolEmployeeLinesBatch(poolKeys)
      .then((data) => {
        if (cancelled) return;
        const map = new Map<string, BonusPoolEmployeeLine[]>();
        for (const item of data.items) {
          map.set(item.poolKey, item.lines);
        }
        setLinesByPoolKey(map);
      })
      .catch(() => {
        if (!cancelled) setLinesByPoolKey(new Map());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, rows]);

  return { linesByPoolKey, loading };
}
