'use client';

import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getMarketingChannelAccentClass,
  MARKETING_SETTINGS_CARD_SURFACE_CLASS,
  MARKETING_SETTINGS_MAP_CATALOG_ACCENT_CLASS,
} from '@/features/marketing/constants/marketing-settings-surface';

interface MarketingSettingsMapRowProps {
  title: string;
  description?: string;
  countLabel: string;
  channel?: string;
  onOpen: () => void;
}

export function MarketingSettingsMapRow({
  title,
  description,
  countLabel,
  channel,
  onOpen,
}: MarketingSettingsMapRowProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(MARKETING_SETTINGS_CARD_SURFACE_CLASS, 'flex w-full items-center gap-3')}
    >
      <span
        className={cn(
          'h-8 w-1 shrink-0 rounded-full',
          channel
            ? getMarketingChannelAccentClass(channel)
            : MARKETING_SETTINGS_MAP_CATALOG_ACCENT_CLASS,
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1 text-left">
        <p className="text-foreground truncate text-sm font-semibold">{title}</p>
        {description ? (
          <p className="text-muted-foreground mt-1 truncate text-xs">{description}</p>
        ) : null}
      </div>
      <span className="text-muted-foreground shrink-0 text-xs">{countLabel}</span>
      <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
    </button>
  );
}
