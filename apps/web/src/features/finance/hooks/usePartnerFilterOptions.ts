import { useCallback, useEffect, useState } from 'react';
import { SUBSCRIPTION_PARTNER_FILTER_UNLINKED } from '@nbos/shared';
import { getApiErrorMessage } from '@/lib/api-errors';
import { partnersApi } from '@/lib/api/partners';

export interface PartnerFilterOption {
  value: string;
  label: string;
}

/** Loads partner names for finance filters (e.g. subscriptions by partner). */
export function usePartnerFilterOptions() {
  const [options, setOptions] = useState<PartnerFilterOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const clearPartnerOptionsLoadError = useCallback(() => {
    setLoadError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { items } = await partnersApi.getAll({ pageSize: 200 });
        if (cancelled) return;
        const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
        setLoadError(null);
        setOptions([
          { value: SUBSCRIPTION_PARTNER_FILTER_UNLINKED, label: 'No partner' },
          ...sorted.map((p) => ({ value: p.id, label: p.name })),
        ]);
      } catch (caught) {
        if (cancelled) return;
        setOptions([{ value: SUBSCRIPTION_PARTNER_FILTER_UNLINKED, label: 'No partner' }]);
        setLoadError(
          getApiErrorMessage(
            caught,
            'Partners could not be loaded. The partner filter may be incomplete.',
          ),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    partnerFilterOptions: options,
    partnerOptionsLoadError: loadError,
    clearPartnerOptionsLoadError,
  };
}
