'use client';

import { Plus, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState, EntityDetailSheetContent } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';
import type { MarketingAccount } from '@/lib/api/marketing';
import { getMarketingLabel } from '@/features/marketing/constants';
import { MARKETING_ACCOUNT_CARD_GRID_CLASS } from '@/features/marketing/constants/marketing-settings-surface';
import { MarketingAccountCard } from './MarketingAccountCard';

interface ChannelAccountsSnapshot {
  channel: string;
  accounts: MarketingAccount[];
}

interface MarketingChannelAccountsSheetProps {
  channel: string | null;
  accounts: MarketingAccount[];
  open: boolean;
  canAdd: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (channel: string) => void;
  onOpenAccount: (account: MarketingAccount) => void;
}

export function MarketingChannelAccountsSheet({
  channel,
  accounts,
  open,
  canAdd,
  onOpenChange,
  onAdd,
  onOpenAccount,
}: MarketingChannelAccountsSheetProps) {
  const { persistedValue, onOpenChangeComplete } = useSheetPersistedValue(
    open && channel != null ? channel : null,
  );
  const hostMounted = useSheetHostMounted(open, persistedValue);
  if (!hostMounted || channel == null) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <EntityDetailSheetContent open={open} layout="full" width="compact" showRailActions={false}>
        <MarketingChannelAccountsSheetBody
          snapshot={{ channel, accounts }}
          canAdd={canAdd}
          onAdd={onAdd}
          onOpenAccount={onOpenAccount}
        />
      </EntityDetailSheetContent>
    </Sheet>
  );
}

function MarketingChannelAccountsSheetBody({
  snapshot,
  canAdd,
  onAdd,
  onOpenAccount,
}: {
  snapshot: ChannelAccountsSnapshot;
  canAdd: boolean;
  onAdd: (channel: string) => void;
  onOpenAccount: (account: MarketingAccount) => void;
}) {
  const t = useTranslations('marketing');
  const channelLabel = getMarketingLabel('channels', snapshot.channel, t);

  return (
    <>
      <MarketingChannelAccountsSheetHeader
        title={channelLabel}
        canAdd={canAdd}
        onAdd={() => onAdd(snapshot.channel)}
      />
      <ScrollArea className="min-h-0 flex-1">
        <div className="px-7 py-4 max-md:px-4">
          {snapshot.accounts.length === 0 ? (
            <EmptyState
              icon={SlidersHorizontal}
              title={t('settings.emptyTitle')}
              description={t('settings.emptyDescription')}
            />
          ) : (
            <div className={MARKETING_ACCOUNT_CARD_GRID_CLASS}>
              {snapshot.accounts.map((account) => (
                <MarketingAccountCard key={account.id} account={account} onOpen={onOpenAccount} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

function MarketingChannelAccountsSheetHeader({
  title,
  canAdd,
  onAdd,
}: {
  title: string;
  canAdd: boolean;
  onAdd: () => void;
}) {
  const t = useTranslations('marketing');
  return (
    <div className="bg-background flex shrink-0 items-start justify-between gap-3 px-7 pt-5 pb-3 max-md:px-4">
      <div className="min-w-0">
        <h2 className="text-foreground truncate text-xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t('settings.accounts.sheetHint')}</p>
      </div>
      {canAdd ? (
        <Button type="button" size="sm" onClick={onAdd}>
          <Plus size={16} />
          {t('settings.add')}
        </Button>
      ) : null}
    </div>
  );
}
