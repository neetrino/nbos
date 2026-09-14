'use client';

import { useTranslations } from 'next-intl';
import type { MarketingAccount } from '@/lib/api/marketing';
import { getMarketingLabel } from '@/features/marketing/constants';
import { MARKETING_SETTINGS_MAP_STACK_CLASS } from '@/features/marketing/constants/marketing-settings-surface';
import type { MarketingAccountChannelGroup } from '@/features/marketing/utils/group-marketing-accounts-by-channel';
import { MarketingSettingsMapRow } from './MarketingSettingsMapRow';

interface MarketingAccountsChannelRowsProps {
  groups: MarketingAccountChannelGroup[];
  onOpenChannel: (channel: string) => void;
}

export function MarketingAccountsChannelRows({
  groups,
  onOpenChannel,
}: MarketingAccountsChannelRowsProps) {
  const t = useTranslations('marketing');
  return (
    <div className={MARKETING_SETTINGS_MAP_STACK_CLASS}>
      {groups.map((group) => (
        <MarketingSettingsMapRow
          key={group.channel}
          channel={group.channel}
          title={getMarketingLabel('channels', group.channel, t)}
          description={unlinkedPlanLabel(group.accounts, (count) =>
            t('settings.accounts.unlinkedCount', { count }),
          )}
          countLabel={t('settings.accounts.groupCount', { count: group.accounts.length })}
          onOpen={() => onOpenChannel(group.channel)}
        />
      ))}
    </div>
  );
}

function unlinkedPlanLabel(
  accounts: MarketingAccount[],
  format: (count: number) => string,
): string | undefined {
  const unlinked = accounts.filter((account) => account.financeExpensePlanId == null).length;
  return unlinked > 0 ? format(unlinked) : undefined;
}
