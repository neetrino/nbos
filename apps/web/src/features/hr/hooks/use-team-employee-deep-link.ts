'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { TEAM_OPEN_EMPLOYEE_QUERY } from '@/features/hr/constants/team-open-query';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { toast } from 'sonner';

function useTeamOpenEmployeeUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openEmployeeId = searchParams.get(TEAM_OPEN_EMPLOYEE_QUERY)?.trim() || null;

  const stripOpenEmployeeFromUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has(TEAM_OPEN_EMPLOYEE_QUERY)) return;
    params.delete(TEAM_OPEN_EMPLOYEE_QUERY);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const pushOpenEmployeeToUrl = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(TEAM_OPEN_EMPLOYEE_QUERY, id);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  return { openEmployeeId, stripOpenEmployeeFromUrl, pushOpenEmployeeToUrl };
}

export function useTeamEmployeeDeepLink(
  employees: Employee[],
  loading: boolean,
  onOpen: (employee: Employee) => void,
) {
  const t = useTranslations('hr');
  const { openEmployeeId, stripOpenEmployeeFromUrl, pushOpenEmployeeToUrl } =
    useTeamOpenEmployeeUrl();
  const attemptedRef = useRef<string | null>(null);

  useEffect(() => {
    attemptedRef.current = null;
  }, [openEmployeeId]);

  useEffect(() => {
    if (!openEmployeeId || (loading && employees.length === 0)) return;
    const match = employees.find((e) => e.id === openEmployeeId);
    if (match) {
      queueMicrotask(() => onOpen(match));
      return;
    }
    if (attemptedRef.current === openEmployeeId) return;
    attemptedRef.current = openEmployeeId;
    let cancelled = false;
    void (async () => {
      try {
        const emp = await employeesApi.getById(openEmployeeId);
        if (!cancelled) onOpen(emp);
      } catch {
        if (!cancelled) {
          toast.error(t('directory.notFound'));
          stripOpenEmployeeFromUrl();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openEmployeeId, loading, employees, onOpen, stripOpenEmployeeFromUrl, t]);

  return { stripOpenEmployeeFromUrl, pushOpenEmployeeToUrl };
}
