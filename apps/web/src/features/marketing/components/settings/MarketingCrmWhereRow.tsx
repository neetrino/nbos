'use client';

import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { MarketingCrmWhereOption } from '@/lib/api/marketing';
import { getMarketingLabel } from '@/features/marketing/constants';
import {
  getMarketingChannelAccentClass,
  MARKETING_SETTINGS_CARD_SURFACE_CLASS,
} from '@/features/marketing/constants/marketing-settings-surface';

interface MarketingCrmWhereRowProps {
  row: MarketingCrmWhereOption;
  onOpen: (row: MarketingCrmWhereOption) => void;
}

export function MarketingCrmWhereRow({ row, onOpen }: MarketingCrmWhereRowProps) {
  const t = useTranslations('marketing');
  const channelLabel = getMarketingLabel('channels', row.channel, t);
  const statusLabel = row.isActive
    ? t('settings.crmWhere.activeInCrm')
    : t('settings.crmWhere.inactive');

  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className={cn(MARKETING_SETTINGS_CARD_SURFACE_CLASS, !row.isActive && 'opacity-70')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className={cn(
              'mt-0.5 h-5 w-1 shrink-0 rounded-full',
              getMarketingChannelAccentClass(row.channel),
            )}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-foreground truncate text-sm font-semibold">{row.label}</p>
            <p className="text-muted-foreground mt-1 truncate text-xs">
              {channelLabel} · {t('settings.crmWhere.sortValue', { value: row.sortOrder })}
            </p>
          </div>
        </div>
        <StatusBadge
          label={statusLabel}
          variant={row.isActive ? 'green' : 'gray'}
          className="rounded-full"
        />
      </div>
    </button>
  );
}
