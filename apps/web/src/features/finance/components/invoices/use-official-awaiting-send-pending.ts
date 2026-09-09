'use client';

import { useEffect, useState } from 'react';
import type { Invoice } from '@/lib/api/finance';
import {
  isOfficialAwaitingSendPending,
  subscribeOfficialAwaitingSendPending,
} from './official-awaiting-send-pending';

export function useOfficialAwaitingSendPending(invoice: Invoice): boolean {
  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    return subscribeOfficialAwaitingSendPending(() => {
      setStoreVersion((version) => version + 1);
    });
  }, []);

  void storeVersion;
  return !invoice.officialInvoiceRequestSent && isOfficialAwaitingSendPending(invoice.id);
}
