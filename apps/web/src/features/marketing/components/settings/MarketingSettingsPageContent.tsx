'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useModuleHeroSlots } from '@/components/shared';
import { MARKETING_MODULE } from '@nbos/shared';
import { usePermission } from '@/lib/permissions';
import { getMarketingLabel } from '@/features/marketing/constants';
import { buildMarketingHeroSearch } from '@/features/marketing/components/build-marketing-hero-search';
import { matchesMarketingSearch } from '@/features/marketing/utils/matches-marketing-search';
import { useMarketingSettingsData } from '@/features/marketing/hooks/use-marketing-settings-data';
import { CreateMarketingAccountDialog } from './CreateMarketingAccountDialog';
import { MarketingAccountsSection } from './MarketingAccountsSection';
import { MarketingCrmWhereSection } from './MarketingCrmWhereSection';

export function MarketingSettingsPageContent() {
  const t = useTranslations('marketing');
  const { can } = usePermission();
  const canEdit = can('EDIT', MARKETING_MODULE);
  const canAdd = can('ADD', MARKETING_MODULE);
  const { accounts, crmWhereRows, expensePlans, loading, plansLoading, error, reload } =
    useMarketingSettingsData();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createNonce, setCreateNonce] = useState(0);
  const [createChannel, setCreateChannel] = useState<string | undefined>();

  const filteredAccounts = useMemo(
    () =>
      accounts.filter((account) =>
        matchesMarketingSearch(
          search,
          account.name,
          account.identifier,
          account.phone,
          getMarketingLabel('channels', account.channel, t),
          getMarketingLabel('accountStatus', account.status, t),
        ),
      ),
    [accounts, search, t],
  );

  const moduleHeroSlots = useMemo(
    () => ({
      search: buildMarketingHeroSearch({
        search,
        onSearchChange: setSearch,
        searchPlaceholder: t('settings.searchPlaceholder'),
      }),
    }),
    [search, t],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="space-y-8">
      {!loading ? (
        <MarketingCrmWhereSection rows={crmWhereRows} canEdit={canEdit} onSaved={reload} />
      ) : null}
      <MarketingAccountsSection
        accounts={accounts}
        filteredAccounts={filteredAccounts}
        whereRows={crmWhereRows}
        expensePlans={expensePlans}
        plansLoading={plansLoading}
        loading={loading}
        error={error}
        canAdd={canAdd}
        canEdit={canEdit}
        onRetry={reload}
        onAdd={(channel) => {
          setCreateChannel(channel);
          setCreateNonce((nonce) => nonce + 1);
          setCreateOpen(true);
        }}
        onSaved={reload}
      />
      <CreateMarketingAccountDialog
        key={createNonce}
        open={createOpen}
        initialChannel={createChannel}
        onOpenChange={setCreateOpen}
        onCreated={reload}
      />
    </div>
  );
}
