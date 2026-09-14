'use client';

import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { MarketingAccount } from '@/lib/api/marketing';
import { getMarketingLabel } from '@/features/marketing/constants';
import {
  getMarketingAccountStatusVariant,
  getMarketingChannelAccentClass,
  MARKETING_SETTINGS_CARD_SURFACE_CLASS,
  marketingAccountUsesPhone,
} from '@/features/marketing/constants/marketing-settings-surface';

interface MarketingAccountCardProps {
  account: MarketingAccount;
  onOpen: (account: MarketingAccount) => void;
}

function accountMetaLine(account: MarketingAccount): string | null {
  const value = marketingAccountUsesPhone(account.channel) ? account.phone : account.identifier;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function MarketingAccountCard({ account, onOpen }: MarketingAccountCardProps) {
  const t = useTranslations('marketing');
  const statusLabel = getMarketingLabel('accountStatus', account.status, t);
  const meta = accountMetaLine(account);
  const planLabel = account.financeExpensePlanId
    ? t('settings.accounts.planLinked')
    : t('settings.accounts.planMissing');

  return (
    <button
      type="button"
      onClick={() => onOpen(account)}
      className={MARKETING_SETTINGS_CARD_SURFACE_CLASS}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className={cn(
              'mt-0.5 h-5 w-1 shrink-0 rounded-full',
              getMarketingChannelAccentClass(account.channel),
            )}
            aria-hidden
          />
          <p className="text-foreground truncate text-sm font-semibold">{account.name}</p>
        </div>
        <StatusBadge
          label={statusLabel}
          variant={getMarketingAccountStatusVariant(account.status)}
          className="rounded-full"
        />
      </div>
      {meta ? <p className="text-muted-foreground mt-3 truncate text-xs">{meta}</p> : null}
      <p
        className={cn(
          'mt-3 text-xs',
          account.financeExpensePlanId
            ? 'text-muted-foreground'
            : 'text-amber-700 dark:text-amber-400',
        )}
      >
        {planLabel}
      </p>
    </button>
  );
}
