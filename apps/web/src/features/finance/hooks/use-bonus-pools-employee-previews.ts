'use client';

import { useEffect, useMemo, useState } from 'react';
import { BONUS_POOL_EMPLOYEE_CSV_MAX_POOLS } from '@/features/finance/constants/bonus-pool-csv-export';
import { bonusesApi, type BonusPoolEmployeeLine, type BonusProductPoolRow } from '@/lib/api/bonus';

const EMPTY_LINES_MAP = new Map<string, BonusPoolEmployeeLine[]>();

export function useBonusPoolsEmployeePreviews(
  rows: readonly BonusProductPoolRow[],
  enabled: boolean,
): {
  linesByPoolKey: Map<string, BonusPoolEmployeeLine[]>;
  loading: boolean;
} {
  const shouldFetch = enabled && rows.length > 0;
  const [linesByPoolKey, setLinesByPoolKey] = useState<Map<string, BonusPoolEmployeeLine[]>>(
    () => EMPTY_LINES_MAP,
  );
  const [loading, setLoading] = useState(false);

  const poolKeysKey = useMemo(() => {
    if (!shouldFetch) return '';
    return rows
      .slice(0, BONUS_POOL_EMPLOYEE_CSV_MAX_POOLS)
      .map((row) => row.poolKey)
      .join(',');
  }, [rows, shouldFetch]);

  useEffect(() => {
    if (!shouldFetch || poolKeysKey.length === 0) return;

    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const data = await bonusesApi.getProductPoolEmployeeLinesBatch(poolKeysKey);
        if (cancelled) return;
        const map = new Map<string, BonusPoolEmployeeLine[]>();
        for (const item of data.items) {
          map.set(item.poolKey, item.lines);
        }
        setLinesByPoolKey(map);
      } catch {
        if (!cancelled) setLinesByPoolKey(EMPTY_LINES_MAP);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [poolKeysKey, shouldFetch]);

  const resolvedLines = shouldFetch ? linesByPoolKey : EMPTY_LINES_MAP;

  return { linesByPoolKey: resolvedLines, loading: shouldFetch && loading };
}
