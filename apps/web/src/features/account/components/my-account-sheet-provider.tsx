'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { EmployeeSheet } from '@/features/hr/components/EmployeeSheet';
import { MY_ACCOUNT_OPEN_QUERY } from '@/features/account/constants/my-account-sheet';
import { loadCurrentEmployeeRecord } from '@/features/account/load-current-employee-record';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { Employee } from '@/lib/api/employees';
import { usePermission } from '@/lib/permissions';

interface MyAccountSheetContextValue {
  openMyAccountSheet: () => Promise<void>;
  closeMyAccountSheet: () => void;
  isOpen: boolean;
}

const MyAccountSheetCtx = createContext<MyAccountSheetContextValue | null>(null);

export function useMyAccountSheet(): MyAccountSheetContextValue {
  const ctx = useContext(MyAccountSheetCtx);
  if (!ctx) {
    throw new Error('useMyAccountSheet must be used within MyAccountSheetProvider');
  }
  return ctx;
}

function buildMyAccountDeepLink(pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  params.set(MY_ACCOUNT_OPEN_QUERY, '1');
  const q = params.toString();
  return q ? `${pathname}?${q}` : `${pathname}?${MY_ACCOUNT_OPEN_QUERY}=1`;
}

export function MyAccountSheetProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { me, can, isLoading: permissionsLoading } = usePermission();

  const canEdit = can('EDIT', 'COMPANY');
  const canViewCompany = can('VIEW', 'COMPANY');

  const [open, setOpen] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);

  const deepLinkHref = useMemo(
    () => buildMyAccountDeepLink(pathname, searchParams.toString()),
    [pathname, searchParams],
  );

  const refreshEmployee = useCallback(async () => {
    if (!me?.id) return null;
    try {
      const record = await loadCurrentEmployeeRecord(me.id, canViewCompany);
      setEmployee(record);
      return record;
    } catch (caught) {
      setEmployee(null);
      toast.error(getApiErrorMessage(caught, 'Profile could not be loaded.'));
      return null;
    }
  }, [canViewCompany, me?.id]);

  const openMyAccountSheet = useCallback(async () => {
    if (!me?.id || permissionsLoading) return;
    setOpen(true);
    if (!employee) await refreshEmployee();
  }, [employee, me?.id, permissionsLoading, refreshEmployee]);

  const closeMyAccountSheet = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (permissionsLoading || !me?.id) return;
    if (searchParams.get(MY_ACCOUNT_OPEN_QUERY) !== '1') return;

    void openMyAccountSheet();

    const next = new URLSearchParams(searchParams.toString());
    next.delete(MY_ACCOUNT_OPEN_QUERY);
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [me?.id, openMyAccountSheet, pathname, permissionsLoading, router, searchParams]);

  const value = useMemo(
    () => ({ openMyAccountSheet, closeMyAccountSheet, isOpen: open }),
    [closeMyAccountSheet, open, openMyAccountSheet],
  );

  return (
    <MyAccountSheetCtx.Provider value={value}>
      {children}
      <EmployeeSheet
        employee={employee}
        open={open}
        selfProfile
        selfProfileDeepLinkHref={deepLinkHref}
        canEdit={canEdit}
        onSaved={() => void refreshEmployee()}
        onOpenChange={(next) => {
          if (!next) closeMyAccountSheet();
        }}
      />
    </MyAccountSheetCtx.Provider>
  );
}
