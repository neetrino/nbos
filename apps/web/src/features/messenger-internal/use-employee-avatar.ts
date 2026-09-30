'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listEmployeesForAppRail } from '@/lib/employees';

export const EMPLOYEE_AVATAR_DIRECTORY_QUERY_KEY = ['app', 'employee-avatar-directory'] as const;

export function useEmployeeAvatarDirectory(): Map<string, string> {
  const query = useQuery({
    queryKey: EMPLOYEE_AVATAR_DIRECTORY_QUERY_KEY,
    queryFn: () => listEmployeesForAppRail(),
    staleTime: 5 * 60 * 1000,
  });
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const row of query.data ?? []) {
      const photo = row.avatar?.trim();
      if (photo) map.set(row.value, photo);
    }
    return map;
  }, [query.data]);
}

export function useEmployeeAvatarUrl(employeeId: string | null | undefined): string | undefined {
  const directory = useEmployeeAvatarDirectory();
  if (!employeeId) return undefined;
  return directory.get(employeeId);
}
