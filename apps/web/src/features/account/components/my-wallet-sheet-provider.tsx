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
import { EmployeeWalletSheet } from '@/features/account/components/employee-wallet-sheet';
import { MY_WALLET_OPEN_QUERY } from '@/features/account/constants/my-account-sheet';
import { WALLET_OPEN_SALARY_LINE_QUERY } from '@/features/account/constants/wallet-url';

interface MyWalletSheetContextValue {
  openMyWalletSheet: (salaryLineId?: string) => void;
  closeMyWalletSheet: () => void;
  isOpen: boolean;
}

const MyWalletSheetCtx = createContext<MyWalletSheetContextValue | null>(null);

export function useMyWalletSheet(): MyWalletSheetContextValue {
  const ctx = useContext(MyWalletSheetCtx);
  if (!ctx) {
    throw new Error('useMyWalletSheet must be used within MyWalletSheetProvider');
  }
  return ctx;
}

function buildWalletDeepLink(
  pathname: string,
  search: string,
  salaryLineId?: string | null,
): string {
  const params = new URLSearchParams(search);
  params.set(MY_WALLET_OPEN_QUERY, '1');
  if (salaryLineId) {
    params.set(WALLET_OPEN_SALARY_LINE_QUERY, salaryLineId);
  }
  const q = params.toString();
  return q ? `${pathname}?${q}` : `${pathname}?${MY_WALLET_OPEN_QUERY}=1`;
}

export function MyWalletSheetProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [initialSalaryLineId, setInitialSalaryLineId] = useState<string | null>(null);

  const deepLinkHref = useMemo(
    () => buildWalletDeepLink(pathname, searchParams.toString(), open ? initialSalaryLineId : null),
    [initialSalaryLineId, open, pathname, searchParams],
  );

  const openMyWalletSheet = useCallback((salaryLineId?: string) => {
    setInitialSalaryLineId(salaryLineId?.trim() || null);
    setOpen(true);
  }, []);

  const closeMyWalletSheet = useCallback(() => {
    setOpen(false);
    setInitialSalaryLineId(null);
  }, []);

  useEffect(() => {
    if (searchParams.get(MY_WALLET_OPEN_QUERY) !== '1') return;

    const salaryLineId = searchParams.get(WALLET_OPEN_SALARY_LINE_QUERY)?.trim() || undefined;
    openMyWalletSheet(salaryLineId);

    const next = new URLSearchParams(searchParams.toString());
    next.delete(MY_WALLET_OPEN_QUERY);
    next.delete(WALLET_OPEN_SALARY_LINE_QUERY);
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [openMyWalletSheet, pathname, router, searchParams]);

  const value = useMemo(
    () => ({ openMyWalletSheet, closeMyWalletSheet, isOpen: open }),
    [closeMyWalletSheet, open, openMyWalletSheet],
  );

  return (
    <MyWalletSheetCtx.Provider value={value}>
      {children}
      <EmployeeWalletSheet
        open={open}
        deepLinkHref={deepLinkHref}
        initialSalaryLineId={initialSalaryLineId}
        onOpenChange={(next) => {
          if (!next) closeMyWalletSheet();
        }}
      />
    </MyWalletSheetCtx.Provider>
  );
}
