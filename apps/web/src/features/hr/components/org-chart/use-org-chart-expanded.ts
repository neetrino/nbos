'use client';

import { useCallback, useState } from 'react';
import { ancestorDepartmentIds, orgChartDefaultExpandedIds } from './org-chart-tree';
import type { DepartmentItem } from '@/lib/api/employees';

export function useOrgChartExpanded(departments: DepartmentItem[]) {
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(() =>
    orgChartDefaultExpandedIds(departments),
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandPathTo = useCallback((departments: DepartmentItem[], departmentId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      for (const id of ancestorDepartmentIds(departments, departmentId)) next.add(id);
      return next;
    });
  }, []);

  return { expandedIds, toggleExpanded, expandPathTo };
}
