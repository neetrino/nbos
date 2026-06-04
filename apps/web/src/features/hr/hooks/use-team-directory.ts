'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DepartmentItem, Employee, RoleItem } from '@/lib/api/employees';
import {
  loadTeamFilterMeta,
  loadTeamList,
  readTeamListCache,
  type TeamListQuery,
} from '@/lib/employees/team-directory-cache';

function buildTeamListQuery(
  search: string,
  filters: Record<string, string>,
  effectiveStatus: string | undefined,
): TeamListQuery {
  return {
    search: search.trim() || undefined,
    roleId: filters.role && filters.role !== 'all' ? filters.role : undefined,
    level: filters.level && filters.level !== 'all' ? filters.level : undefined,
    status: effectiveStatus,
    departmentId:
      filters.department && filters.department !== 'all' ? filters.department : undefined,
  };
}

export function useTeamDirectory(
  search: string,
  filters: Record<string, string>,
  effectiveStatus: string | undefined,
) {
  const listQuery = useMemo(
    () => buildTeamListQuery(search, filters, effectiveStatus),
    [search, filters, effectiveStatus],
  );

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cached = readTeamListCache(listQuery);

    if (cached) {
      setEmployees(cached.items);
      setTotal(cached.total);
      setLoading(false);
      setRefreshing(true);
      setError(null);
    } else {
      setLoading(true);
      setRefreshing(false);
    }

    void loadTeamList(listQuery)
      .then((entry) => {
        if (cancelled) return;
        setEmployees(entry.items);
        setTotal(entry.total);
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        if (!cached) {
          setError('Employees could not be loaded. Check your connection and try again.');
        }
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [listQuery]);

  useEffect(() => {
    let active = true;
    void loadTeamFilterMeta()
      .then((meta) => {
        if (!active) return;
        setRoles(meta.roles);
        setDepartments(meta.departments);
      })
      .catch(() => {
        if (!active) return;
        setRoles([]);
        setDepartments([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const refetch = useCallback(async () => {
    setRefreshing(true);
    try {
      const entry = await loadTeamList(listQuery);
      setEmployees(entry.items);
      setTotal(entry.total);
      setError(null);
    } catch {
      setError('Employees could not be loaded. Check your connection and try again.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [listQuery]);

  return {
    employees,
    total,
    roles,
    departments,
    loading,
    refreshing,
    error,
    refetch,
  };
}
