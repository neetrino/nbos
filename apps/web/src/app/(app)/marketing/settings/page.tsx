'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  useModuleHeroSlots,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  marketingApi,
  type MarketingAccount,
  type MarketingCrmWhereOption,
} from '@/lib/api/marketing';
import {
  MARKETING_ACCOUNT_STATUSES,
  MARKETING_CHANNELS,
  getMarketingLabel,
} from '@/features/marketing/constants';
import { buildMarketingHeroSearch } from '@/features/marketing/components/build-marketing-hero-search';
import { MarketingAccountExpensePlanLink } from '@/features/marketing/components/MarketingAccountExpensePlanLink';
import { MarketingCrmWhereSettingsSection } from '@/features/marketing/components/MarketingCrmWhereSettingsSection';
import { matchesMarketingSearch } from '@/features/marketing/utils/matches-marketing-search';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import { loadExpensePlansForMarketingAccounts } from '@/features/marketing/utils/load-expense-plans-for-marketing-accounts';

export default function MarketingSettingsPage() {
  const t = useTranslations('marketing');
  const [accounts, setAccounts] = useState<MarketingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLinkId, setSavingLinkId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [financeLinks, setFinanceLinks] = useState<Record<string, string>>({});
  const [expensePlans, setExpensePlans] = useState<ExpensePlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [crmWhereRows, setCrmWhereRows] = useState<MarketingCrmWhereOption[]>([]);
  const [crmWhereDraft, setCrmWhereDraft] = useState<
    Record<string, { label: string; sortOrder: string; isActive: boolean }>
  >({});
  const [savingWhereChannel, setSavingWhereChannel] = useState<string | null>(null);
  const [form, setForm] = useState({
    channel: 'LIST_AM',
    name: '',
    identifier: '',
    phone: '',
  });

  const fetchAccounts = async () => {
    setLoading(true);
    setPlansLoading(true);
    try {
      const [nextAccounts, whereRows] = await Promise.all([
        marketingApi.getAccounts(),
        marketingApi.getCrmWhereOptions({ includeInactive: true }),
      ]);
      const plans = await loadExpensePlansForMarketingAccounts(nextAccounts);
      setExpensePlans(plans);
      setAccounts(nextAccounts);
      setCrmWhereRows(whereRows);
      setCrmWhereDraft(
        Object.fromEntries(
          whereRows.map((row) => [
            row.channel,
            {
              label: row.label,
              sortOrder: String(row.sortOrder),
              isActive: row.isActive,
            },
          ]),
        ),
      );
      setFinanceLinks(
        Object.fromEntries(
          nextAccounts.map((account) => [account.id, account.financeExpensePlanId ?? '']),
        ),
      );
      setError(null);
    } catch {
      setError(t('settings.loadError'));
    } finally {
      setLoading(false);
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await marketingApi.createAccount({
        channel: form.channel,
        name: form.name.trim(),
        identifier: form.identifier || undefined,
        phone: form.phone || undefined,
      });
      setForm({ channel: form.channel, name: '', identifier: '', phone: '' });
      await fetchAccounts();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCrmWhereRow = async (channel: string) => {
    const rowDraft = crmWhereDraft[channel];
    if (!rowDraft || !rowDraft.label.trim()) return;
    setSavingWhereChannel(channel);
    try {
      await marketingApi.updateCrmWhereOption(channel, {
        label: rowDraft.label.trim(),
        sortOrder: Number.parseInt(rowDraft.sortOrder, 10) || 0,
        isActive: rowDraft.isActive,
      });
      await fetchAccounts();
    } finally {
      setSavingWhereChannel(null);
    }
  };

  const handleCrmWhereDraftChange = (
    channel: string,
    patch: Partial<{ label: string; sortOrder: string; isActive: boolean }>,
  ) => {
    const prev = crmWhereDraft[channel];
    if (!prev) return;
    setCrmWhereDraft({ ...crmWhereDraft, [channel]: { ...prev, ...patch } });
  };

  const handleSaveFinanceLink = async (account: MarketingAccount) => {
    setSavingLinkId(account.id);
    try {
      await marketingApi.updateAccount(account.id, {
        financeExpensePlanId: financeLinks[account.id]?.trim() || null,
      });
      await fetchAccounts();
    } finally {
      setSavingLinkId(null);
    }
  };

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
    <div className="space-y-6">
      <MarketingCrmWhereSettingsSection
        rows={crmWhereRows}
        draft={crmWhereDraft}
        onDraftChange={handleCrmWhereDraftChange}
        onSaveRow={handleSaveCrmWhereRow}
        savingChannel={savingWhereChannel}
      />

      <form
        onSubmit={handleCreate}
        className="border-border bg-card grid gap-4 rounded-2xl border p-5 md:grid-cols-5"
      >
        <div className="space-y-1.5">
          <Label>{t('settings.channel')}</Label>
          <Select
            value={form.channel}
            onValueChange={(channel) => setForm({ ...form, channel: channel ?? form.channel })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MARKETING_CHANNELS.map((channel) => (
                <SelectItem key={channel.value} value={channel.value}>
                  {getMarketingLabel('channels', channel.value, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t('settings.name')}</Label>
          <Input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder={t('settings.namePlaceholder')}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('settings.identifier')}</Label>
          <Input
            value={form.identifier}
            onChange={(event) => setForm({ ...form, identifier: event.target.value })}
            placeholder={t('settings.identifierPlaceholder')}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('settings.phone')}</Label>
          <Input
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            placeholder={t('settings.phonePlaceholder')}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="invisible select-none" aria-hidden>
            {t('settings.add')}
          </Label>
          <Button
            type="submit"
            size="form"
            disabled={saving || !form.name.trim()}
            className="w-full"
          >
            <Plus size={16} />
            {saving ? t('settings.adding') : t('settings.add')}
          </Button>
        </div>
      </form>

      {loading ? (
        <LoadingState variant="list" count={4} />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchAccounts} />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={SlidersHorizontal}
          title={t('settings.emptyTitle')}
          description={t('settings.emptyDescription')}
        />
      ) : filteredAccounts.length === 0 ? (
        <EmptyState
          icon={SlidersHorizontal}
          title={t('settings.noMatchTitle')}
          description={t('settings.noMatchDescription')}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredAccounts.map((account) => (
            <div key={account.id} className="border-border bg-card rounded-2xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{account.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {getMarketingLabel('channels', account.channel, t)}
                  </p>
                </div>
                <StatusBadge
                  label={getMarketingLabel('accountStatus', account.status, t)}
                  variant={account.status === 'ACTIVE' ? 'green' : 'gray'}
                />
              </div>
              <div className="text-muted-foreground mt-4 space-y-1 text-sm">
                <p>
                  {t('settings.identifierValue', {
                    value: account.identifier ?? t('board.notSet'),
                  })}
                </p>
                <p>
                  {t('settings.phoneValue', {
                    value: account.phone ?? t('board.notSet'),
                  })}
                </p>
                <p>{t('settings.noFinanceLinkHint')}</p>
              </div>
              <MarketingAccountExpensePlanLink
                account={account}
                expensePlans={expensePlans}
                selectedPlanId={financeLinks[account.id] ?? ''}
                onSelectedPlanIdChange={(planId) =>
                  setFinanceLinks({ ...financeLinks, [account.id]: planId })
                }
                onSave={() => handleSaveFinanceLink(account)}
                saving={savingLinkId === account.id}
                plansLoading={plansLoading}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
