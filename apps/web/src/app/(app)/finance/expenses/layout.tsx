'use client';

import type { ReactNode } from 'react';
import { ExpenseFinanceSubNav } from '@/features/finance/components/expenses/ExpenseFinanceSubNav';

export default function FinanceExpensesLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <ExpenseFinanceSubNav />
      {children}
    </div>
  );
}
