'use client';

import { useEffect, useState } from 'react';
import { marketingApi } from '@/lib/api/marketing';
import { MARKETING_CHANNELS } from '@/features/marketing/constants';

export interface CrmWhereSelectOption {
  value: string;
  label: string;
}

export function useCrmMarketingWhereOptions(enabled: boolean) {
  const [fetchedOptions, setFetchedOptions] = useState<CrmWhereSelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      try {
        const rows = await marketingApi.getCrmWhereOptions();
        if (!cancelled) {
          setFetchedOptions(rows.map((row) => ({ value: row.channel, label: row.label })));
        }
      } catch {
        if (!cancelled) {
          setFetchedOptions(MARKETING_CHANNELS.map((c) => ({ value: c.value, label: c.label })));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return {
    options: enabled ? fetchedOptions : [],
    loading: enabled && loading,
  };
}
