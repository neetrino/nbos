'use client';

import { useEffect, useState } from 'react';
import { marketingApi } from '@/lib/api/marketing';
import { MARKETING_CHANNELS } from '@/features/marketing/constants';

export interface CrmWhereSelectOption {
  value: string;
  label: string;
}

export function useCrmMarketingWhereOptions(enabled: boolean) {
  const [options, setOptions] = useState<CrmWhereSelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    marketingApi
      .getCrmWhereOptions()
      .then((rows) => {
        if (!cancelled) {
          setOptions(rows.map((row) => ({ value: row.channel, label: row.label })));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOptions(MARKETING_CHANNELS.map((c) => ({ value: c.value, label: c.label })));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { options, loading };
}
