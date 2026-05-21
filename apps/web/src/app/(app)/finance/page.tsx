'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { readFinanceModuleEntryHref } from '@/features/finance/constants/finance-zone-storage';

export default function FinancePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(readFinanceModuleEntryHref());
  }, [router]);

  return null;
}
