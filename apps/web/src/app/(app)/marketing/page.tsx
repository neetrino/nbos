'use client';

import { useEffect, useMemo, useState } from 'react';
import { Megaphone, Plus } from 'lucide-react';
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
import { NbosMoneyInput } from '@/components/shared/NbosMoneyInput';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { marketingApi, type MarketingActivity } from '@/lib/api/marketing';
import {
  MARKETING_ACTIVITY_STATUSES,
  MARKETING_ACTIVITY_TYPES,
  MARKETING_CHANNELS,
  getMarketingLabel,
} from '@/features/marketing/constants';
import { buildMarketingHeroSearch } from '@/features/marketing/components/build-marketing-hero-search';
import { MarketingLaunchDialog } from '@/features/marketing/components/MarketingLaunchDialog';
import { matchesMarketingSearch } from '@/features/marketing/utils/matches-marketing-search';
import type { MarketingAccount } from '@/lib/api/marketing';

export default function MarketingPage() {
  const t = useTranslations('marketing');
  const [activities, setActivities] = useState<MarketingActivity[]>([]);
  const [accounts, setAccounts] = useState<MarketingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    title: '',
    channel: 'META_ADS',
    type: 'AD_CAMPAIGN',
    budget: '',
    description: '',
  });

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const [nextActivities, nextAccounts] = await Promise.all([
        marketingApi.getActivities(),
        marketingApi.getAccounts({ status: 'ACTIVE' }),
      ]);
      setActivities(nextActivities);
      setAccounts(nextAccounts);
      setError(null);
    } catch {
      setError(t('board.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const filteredActivities = useMemo(
    () =>
      activities.filter((activity) =>
        matchesMarketingSearch(
          search,
          activity.title,
          activity.description,
          activity.account?.name,
          getMarketingLabel('channels', activity.channel, t),
          getMarketingLabel('activityType', activity.type, t),
        ),
      ),
    [activities, search, t],
  );

  const columns = useMemo(() => {
    const byStatus = new Map<string, MarketingActivity[]>();
    for (const row of MARKETING_ACTIVITY_STATUSES) {
      byStatus.set(row.value, []);
    }
    for (const activity of filteredActivities) {
      const bucket = byStatus.get(activity.status) ?? [];
      bucket.push(activity);
      byStatus.set(activity.status, bucket);
    }
    return MARKETING_ACTIVITY_STATUSES.map((row) => ({
      status: row.value,
      label: getMarketingLabel('activityStatus', row.value, t),
      items: byStatus.get(row.value) ?? [],
    }));
  }, [filteredActivities, t]);

  const moduleHeroSlots = useMemo(
    () => ({
      search: buildMarketingHeroSearch({
        search,
        onSearchChange: setSearch,
        searchPlaceholder: t('board.searchPlaceholder'),
      }),
    }),
    [search, t],
  );

  useModuleHeroSlots(moduleHeroSlots);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await marketingApi.createActivity({
        title: form.title.trim(),
        channel: form.channel,
        type: form.type,
        budget: form.budget ? Number(form.budget) : undefined,
        description: form.description || undefined,
      });
      setForm({ title: '', channel: form.channel, type: form.type, budget: '', description: '' });
      await fetchActivities();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreate}
        className="border-border bg-card grid gap-4 rounded-2xl border p-5 lg:grid-cols-6"
      >
        <div className="space-y-1.5 lg:col-span-2">
          <Label>{t('board.title')}</Label>
          <Input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder={t('board.titlePlaceholder')}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('board.channel')}</Label>
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
          <Label>{t('board.type')}</Label>
          <Select
            value={form.type}
            onValueChange={(type) => setForm({ ...form, type: type ?? form.type })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MARKETING_ACTIVITY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {getMarketingLabel('activityType', type.value, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <NbosMoneyInput
            label={t('board.budget')}
            value={form.budget}
            onChange={(budget) => setForm({ ...form, budget })}
            placeholder={t('board.budgetPlaceholder')}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="invisible select-none" aria-hidden>
            {t('board.add')}
          </Label>
          <Button
            type="submit"
            size="form"
            disabled={saving || !form.title.trim()}
            className="w-full"
          >
            <Plus size={16} />
            {saving ? t('board.adding') : t('board.add')}
          </Button>
        </div>
        <div className="space-y-1.5 lg:col-span-6">
          <Label>{t('board.description')}</Label>
          <Textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder={t('board.descriptionPlaceholder')}
          />
        </div>
      </form>

      {loading ? (
        <LoadingState variant="cards" count={4} />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchActivities} />
      ) : activities.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={t('board.emptyTitle')}
          description={t('board.emptyDescription')}
        />
      ) : filteredActivities.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={t('board.noMatchTitle')}
          description={t('board.noMatchDescription')}
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {columns.map((column) => (
            <section
              key={column.status}
              className="border-border bg-muted/30 flex min-w-[min(100%,320px)] flex-1 flex-col rounded-2xl border"
            >
              <div className="border-border flex items-center justify-between border-b px-3 py-2">
                <h2 className="text-sm font-semibold">{column.label}</h2>
                <span className="text-muted-foreground text-xs">{column.items.length}</span>
              </div>
              <div className="flex flex-col gap-3 p-3">
                {column.items.length === 0 ? (
                  <p className="text-muted-foreground px-1 text-xs">{t('board.emptyColumn')}</p>
                ) : (
                  column.items.map((activity) => (
                    <div
                      key={activity.id}
                      className="border-border bg-card rounded-xl border p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{activity.title}</p>
                          <p className="text-muted-foreground text-sm">
                            {getMarketingLabel('channels', activity.channel, t)}
                          </p>
                        </div>
                        <StatusBadge
                          label={getMarketingLabel('activityStatus', activity.status, t)}
                          variant={activity.status === 'LAUNCHED' ? 'green' : 'blue'}
                        />
                      </div>
                      <p className="text-muted-foreground mt-3 line-clamp-3 text-sm">
                        {activity.description ?? t('board.noDescription')}
                      </p>
                      <div className="text-muted-foreground mt-4 grid grid-cols-2 gap-2 text-xs">
                        <span>
                          {t('board.typeLabel', {
                            type: getMarketingLabel('activityType', activity.type, t),
                          })}
                        </span>
                        <span>
                          {t('board.budgetLabel', {
                            amount: activity.budget
                              ? `${activity.budget} ${activity.currency}`
                              : '—',
                          })}
                        </span>
                        <span>
                          {t('board.accountLabel', {
                            name: activity.account?.name ?? t('board.notLinked'),
                          })}
                        </span>
                        <span>
                          {t('board.expense', {
                            status: activity.expenseCardId
                              ? t('board.expenseLinked')
                              : t('board.expenseMissing'),
                          })}
                        </span>
                        <span>
                          {t('board.start', {
                            date: activity.startDate?.slice(0, 10) ?? t('board.notScheduled'),
                          })}
                        </span>
                        <span>
                          {t('board.payBy', {
                            date: activity.expectedPayAt?.slice(0, 10) ?? t('board.notSet'),
                          })}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-muted-foreground text-xs">
                          {activity.expenseCardId
                            ? t('board.financeProposed')
                            : t('board.financeMissing')}
                        </p>
                        <MarketingLaunchDialog
                          activity={activity}
                          accounts={accounts}
                          onLaunched={fetchActivities}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
