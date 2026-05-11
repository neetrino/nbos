'use client';

import { useCallback } from 'react';
import { employeesApi } from '@/lib/api/employees';

export type EmployeeSearchFn = (
  query: string,
) => Promise<Array<{ value: string; label: string; subtitle?: string }>>;

export function useEmployeeSearchLoader(): EmployeeSearchFn {
  return useCallback(async (query: string) => {
    const data = await employeesApi.getAll({ pageSize: 20, search: query || undefined });
    return data.items.map((employee) => ({
      value: employee.id,
      label: `${employee.firstName} ${employee.lastName}`,
      subtitle: employee.position ?? employee.email,
    }));
  }, []);
}
