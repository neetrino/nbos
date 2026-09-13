'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { marketingApi } from '@/lib/api/marketing';
import { MARKETING_CHANNELS } from '@/features/marketing/constants';
import { translateMarketingChannelLabel } from '@/features/marketing/i18n/marketing-copy';

export interface CrmWhereSelectOption {
  value: string;
  label: string;
}

export function useCrmMarketingWhereOptions(enabled: boolean) {
  const tMarketing = useTranslations('marketing');
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
          setFetchedOptions(
            MARKETING_CHANNELS.map((channel) => ({
              value: channel.value,
              label: translateMarketingChannelLabel(tMarketing, channel.value),
            })),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, tMarketing]);

  return {
    options: enabled ? fetchedOptions : [],
    loading: enabled && loading,
  };
}
