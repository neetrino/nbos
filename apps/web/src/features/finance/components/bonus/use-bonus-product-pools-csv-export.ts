'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { BONUS_POOL_EMPLOYEE_CSV_MAX_POOLS } from '@/features/finance/constants/bonus-pool-csv-export';
import { downloadBonusPoolEmployeesCsv } from '@/features/finance/utils/export-bonus-pool-employees-csv';
import { downloadBonusProductPoolsCsv } from '@/features/finance/utils/export-bonus-product-pools-csv';
import { getApiErrorMessage } from '@/lib/api-errors';
import { bonusesApi, type BonusPoolEmployeeLine, type BonusProductPoolRow } from '@/lib/api/bonus';

async function fetchEmployeeLinesByPool(
  pools: readonly BonusProductPoolRow[],
): Promise<Map<string, BonusPoolEmployeeLine[]>> {
  const slice = pools.slice(0, BONUS_POOL_EMPLOYEE_CSV_MAX_POOLS);
  const results = await Promise.all(
    slice.map(async (pool) => {
      const data = await bonusesApi.getProductPoolEmployeeLines(pool.poolKey);
      return [pool.poolKey, data.lines] as const;
    }),
  );
  return new Map(results);
}

export function useBonusProductPoolsCsvExport(rows: BonusProductPoolRow[]) {
  const [exportCsvSubmitting, setExportCsvSubmitting] = useState(false);
  const [exportEmployeesSubmitting, setExportEmployeesSubmitting] = useState(false);

  const handleExportCsv = useCallback(() => {
    if (rows.length === 0) {
      toast('No bonus pool rows to export.');
      return;
    }
    setExportCsvSubmitting(true);
    try {
      downloadBonusProductPoolsCsv(rows);
      toast.success(
        `Exported ${rows.length} pool roll-up${rows.length === 1 ? '' : 's'} (UTF-8 CSV)`,
      );
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not export bonus pool CSV.'));
    } finally {
      setExportCsvSubmitting(false);
    }
  }, [rows]);

  const handleExportEmployeesCsv = useCallback(async () => {
    if (rows.length === 0) {
      toast('No bonus pool rows to export.');
      return;
    }
    const capped = rows.length > BONUS_POOL_EMPLOYEE_CSV_MAX_POOLS;
    setExportEmployeesSubmitting(true);
    try {
      const linesByPool = await fetchEmployeeLinesByPool(rows);
      const lineCount = [...linesByPool.values()].reduce((n, lines) => n + lines.length, 0);
      downloadBonusPoolEmployeesCsv(rows.slice(0, BONUS_POOL_EMPLOYEE_CSV_MAX_POOLS), linesByPool);
      const suffix = capped ? ` (first ${BONUS_POOL_EMPLOYEE_CSV_MAX_POOLS} pools)` : '';
      toast.success(`Exported ${lineCount} employee line${lineCount === 1 ? '' : 's'}${suffix}`);
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not export employee breakdown CSV.'));
    } finally {
      setExportEmployeesSubmitting(false);
    }
  }, [rows]);

  return {
    exportCsvSubmitting,
    exportEmployeesSubmitting,
    handleExportCsv,
    handleExportEmployeesCsv,
  };
}
