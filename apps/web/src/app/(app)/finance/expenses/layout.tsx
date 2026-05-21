'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ExpenseFinanceSubNav } from '@/features/finance/components/expenses/ExpenseFinanceSubNav';

const EXPENSE_PLANS_PATH_PREFIX = '/finance/expenses/plans';

export default function FinanceExpensesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showBoardSubNav = !pathname.startsWith(EXPENSE_PLANS_PATH_PREFIX);

  return (
    <div>
      {showBoardSubNav ? <ExpenseFinanceSubNav /> : null}
      {children}
    </div>
  );
}
