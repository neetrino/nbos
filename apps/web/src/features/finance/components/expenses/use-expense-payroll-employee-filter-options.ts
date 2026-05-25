'use client';

import { useEffect, useState } from 'react';
import { employeesApi } from '@/lib/api/employees';

const EMPLOYEE_FILTER_PAGE_SIZE = 200;

export function useExpensePayrollEmployeeFilterOptions(): Array<{ value: string; label: string }> {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await employeesApi.getAll({ page: 1, pageSize: EMPLOYEE_FILTER_PAGE_SIZE });
        if (cancelled) return;
        const rows = res.items
          .map((emp) => ({
            value: emp.id,
            label: `${emp.firstName} ${emp.lastName}`.trim() || emp.email,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setOptions(rows);
      } catch {
        if (!cancelled) setOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return options;
}
