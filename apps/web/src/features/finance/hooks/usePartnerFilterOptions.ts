import { useEffect, useState } from 'react';
import { SUBSCRIPTION_PARTNER_FILTER_UNLINKED } from '@nbos/shared';
import { partnersApi } from '@/lib/api/partners';

export interface PartnerFilterOption {
  value: string;
  label: string;
}

/** Loads partner names for finance filters (e.g. subscriptions by partner). */
export function usePartnerFilterOptions() {
  const [options, setOptions] = useState<PartnerFilterOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { items } = await partnersApi.getAll({ pageSize: 200 });
        if (cancelled) return;
        const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
        setOptions([
          { value: SUBSCRIPTION_PARTNER_FILTER_UNLINKED, label: 'No partner' },
          ...sorted.map((p) => ({ value: p.id, label: p.name })),
        ]);
      } catch {
        if (!cancelled) setOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { partnerFilterOptions: options };
}
