'use client';

import { useCallback } from 'react';
import { searchEmployeesForPicker } from '@/lib/employees';

export type EmployeeSearchFn = (
  query: string,
) => Promise<Array<{ value: string; label: string; subtitle?: string }>>;

export function useEmployeeSearchLoader(): EmployeeSearchFn {
  return useCallback(async (query: string) => searchEmployeesForPicker(query), []);
}
