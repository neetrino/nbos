'use client';

import { useState } from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import type { MarketingAccount, MarketingCrmWhereOption } from '@/lib/api/marketing';
import {
  groupMarketingAccountsByChannel,
  resolveMarketingChannelOrder,
} from '@/features/marketing/utils/group-marketing-accounts-by-channel';
import { MarketingAccountSheet } from './MarketingAccountSheet';
import { MarketingAccountsChannelRows } from './MarketingAccountsChannelRows';
import { MarketingChannelAccountsSheet } from './MarketingChannelAccountsSheet';

interface MarketingAccountsSectionProps {
  accounts: MarketingAccount[];
  filteredAccounts: MarketingAccount[];
  whereRows: MarketingCrmWhereOption[];
  expensePlans: ExpensePlan[];
  plansLoading: boolean;
  loading: boolean;
  error: string | null;
  canAdd: boolean;
  canEdit: boolean;
  onRetry: () => Promise<void>;
  onAdd: (channel?: string) => void;
  onSaved: () => Promise<void>;
}

export function MarketingAccountsSection(props: MarketingAccountsSectionProps) {
  const t = useTranslations('marketing');
  const addButton = props.canAdd ? (
    <Button type="button" onClick={() => props.onAdd()}>
      <Plus size={16} />
      {t('settings.add')}
    </Button>
  ) : null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-foreground text-base font-semibold">{t('settings.accounts.title')}</h2>
        {addButton}
      </div>
      <MarketingAccountsMapBody {...props} />
    </section>
  );
}

function MarketingAccountsMapBody(props: MarketingAccountsSectionProps) {
  const t = useTranslations('marketing');
  if (props.loading) return <LoadingState variant="list" count={3} />;
  if (props.error) {
    return <ErrorState description={props.error} onRetry={() => void props.onRetry()} />;
  }
  if (props.accounts.length === 0) {
    return (
      <EmptyState
        icon={SlidersHorizontal}
        title={t('settings.emptyTitle')}
        description={t('settings.emptyDescription')}
        action={
          props.canAdd ? (
            <Button type="button" onClick={() => props.onAdd()}>
              <Plus size={16} />
              {t('settings.add')}
            </Button>
          ) : undefined
        }
      />
    );
  }
  if (props.filteredAccounts.length === 0) {
    return (
      <EmptyState
        icon={SlidersHorizontal}
        title={t('settings.noMatchTitle')}
        description={t('settings.noMatchDescription')}
      />
    );
  }
  return <MarketingAccountsChannelMap {...props} />;
}

function MarketingAccountsChannelMap(props: MarketingAccountsSectionProps) {
  const [openChannel, setOpenChannel] = useState<string | null>(null);
  const [channelSheetOpen, setChannelSheetOpen] = useState(false);
  const [openAccount, setOpenAccount] = useState<MarketingAccount | null>(null);
  const groups = groupMarketingAccountsByChannel(
    props.filteredAccounts,
    resolveMarketingChannelOrder(props.whereRows),
  );
  const channelAccounts = props.filteredAccounts.filter(
    (account) => account.channel === openChannel,
  );
  const selectedAccount =
    openAccount == null
      ? null
      : (props.accounts.find((account) => account.id === openAccount.id) ?? openAccount);

  return (
    <>
      <MarketingAccountsChannelRows
        groups={groups}
        onOpenChannel={(channel) => {
          setOpenChannel(channel);
          setChannelSheetOpen(true);
        }}
      />
      <MarketingChannelAccountsSheet
        channel={openChannel}
        accounts={channelAccounts}
        open={channelSheetOpen}
        canAdd={props.canAdd}
        onOpenChange={(open) => {
          if (!open) {
            setOpenAccount(null);
            setChannelSheetOpen(false);
          }
        }}
        onAdd={props.onAdd}
        onOpenAccount={setOpenAccount}
      />
      <MarketingAccountSheet
        account={selectedAccount}
        open={selectedAccount != null}
        canEdit={props.canEdit}
        expensePlans={props.expensePlans}
        plansLoading={props.plansLoading}
        onOpenChange={(open) => {
          if (!open) setOpenAccount(null);
        }}
        onSaved={props.onSaved}
      />
    </>
  );
}
