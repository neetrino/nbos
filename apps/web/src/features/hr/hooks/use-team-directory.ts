'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { TeamDirectoryStatusQuery } from '@/features/hr/constants/team-directory-status';
import {
  employeesApi,
  type DepartmentItem,
  type Employee,
  type RoleItem,
} from '@/lib/api/employees';
import {
  loadTeamFilterMeta,
  loadTeamList,
  readTeamListCache,
  type TeamListQuery,
} from '@/lib/employees/team-directory-cache';

const STATUS_COUNT_PAGE_SIZE = 1;
const DIRECTORY_STATUS_KEYS = ['ACTIVE', 'PROBATION', 'ON_LEAVE', 'TERMINATED'] as const;

function buildTeamListQuery(
  search: string,
  filters: Record<string, string>,
  statusQuery: TeamDirectoryStatusQuery,
): TeamListQuery {
  return {
    search: search.trim() || undefined,
    roleId: filters.role && filters.role !== 'all' ? filters.role : undefined,
    level: filters.level && filters.level !== 'all' ? filters.level : undefined,
    status: statusQuery.status,
    excludeStatus: statusQuery.excludeStatus,
    departmentId:
      filters.department && filters.department !== 'all' ? filters.department : undefined,
  };
}

export function useTeamDirectory(
  search: string,
  filters: Record<string, string>,
  statusQuery: TeamDirectoryStatusQuery,
) {
  const listQuery = useMemo(
    () => buildTeamListQuery(search, filters, statusQuery),
    [search, filters, statusQuery],
  );

  const t = useTranslations('hr');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [statusTotals, setStatusTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    const cached = readTeamListCache(listQuery);

    if (cached) {
      setEmployees(cached.items);
      setTotal(cached.total);
      setLoading(false);
      setRefreshing(true);
      setFailed(false);
    } else {
      setLoading(true);
      setRefreshing(false);
    }

    void loadTeamList(listQuery)
      .then((entry) => {
        if (cancelled) return;
        setEmployees(entry.items);
        setTotal(entry.total);
        setFailed(false);
      })
      .catch(() => {
        if (cancelled) return;
        if (!cached) {
          setFailed(true);
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

  const refreshStatusTotals = useCallback(async () => {
    try {
      const results = await Promise.all(
        DIRECTORY_STATUS_KEYS.map((status) =>
          employeesApi.getAll({
            pageSize: STATUS_COUNT_PAGE_SIZE,
            search: listQuery.search,
            roleId: listQuery.roleId,
            level: listQuery.level,
            departmentId: listQuery.departmentId,
            status,
          }),
        ),
      );
      const next: Record<string, number> = {};
      DIRECTORY_STATUS_KEYS.forEach((status, index) => {
        next[status] = results[index]?.meta.total ?? 0;
      });
      setStatusTotals(next);
    } catch {
      setStatusTotals({});
    }
  }, [listQuery.search, listQuery.roleId, listQuery.level, listQuery.departmentId]);

  useEffect(() => {
    void refreshStatusTotals();
  }, [refreshStatusTotals]);

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
      setFailed(false);
      await refreshStatusTotals();
    } catch {
      setFailed(true);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [listQuery, refreshStatusTotals]);

  return {
    employees,
    total,
    roles,
    departments,
    loading,
    refreshing,
    statusTotals,
    error: failed ? t('directory.loadFailed') : null,
    refetch,
  };
}
