'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Megaphone, Plus, RefreshCcw } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
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
import { MarketingLaunchDialog } from '@/features/marketing/components/MarketingLaunchDialog';
import type { MarketingAccount } from '@/lib/api/marketing';

export default function MarketingPage() {
  const [activities, setActivities] = useState<MarketingActivity[]>([]);
  const [accounts, setAccounts] = useState<MarketingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      setError('Marketing activities could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const columns = useMemo(() => {
    const byStatus = new Map<string, MarketingActivity[]>();
    for (const row of MARKETING_ACTIVITY_STATUSES) {
      byStatus.set(row.value, []);
    }
    for (const activity of activities) {
      const bucket = byStatus.get(activity.status) ?? [];
      bucket.push(activity);
      byStatus.set(activity.status, bucket);
    }
    return MARKETING_ACTIVITY_STATUSES.map((row) => ({
      status: row.value,
      label: row.label,
      items: byStatus.get(row.value) ?? [],
    }));
  }, [activities]);

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
      <PageHeader
        title="Marketing Board"
        description="Demand generation activities that can become CRM attribution sources."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/marketing/attribution"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Attribution Review
          </Link>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchActivities}
            aria-label="Refresh board"
          >
            <RefreshCcw size={16} />
          </Button>
        </div>
      </PageHeader>

      <form
        onSubmit={handleCreate}
        className="border-border bg-card grid gap-4 rounded-2xl border p-5 lg:grid-cols-6"
      >
        <div className="lg:col-span-2">
          <Label>Activity title</Label>
          <Input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Instagram Spring Promo"
          />
        </div>
        <div>
          <Label>Channel</Label>
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
                  {channel.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type</Label>
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
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Budget</Label>
          <Input
            type="number"
            value={form.budget}
            onChange={(event) => setForm({ ...form, budget: event.target.value })}
            placeholder="AMD"
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={saving || !form.title.trim()} className="w-full">
            <Plus size={16} />
            {saving ? 'Adding...' : 'Add'}
          </Button>
        </div>
        <div className="lg:col-span-6">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Campaign goal, creative notes, audience, expected launch..."
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
          title="No marketing activities yet"
          description="Create the first activity to start building the Marketing Board."
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
                  <p className="text-muted-foreground px-1 text-xs">No activities in this stage.</p>
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
                            {getMarketingLabel(MARKETING_CHANNELS, activity.channel)}
                          </p>
                        </div>
                        <StatusBadge
                          label={getMarketingLabel(MARKETING_ACTIVITY_STATUSES, activity.status)}
                          variant={activity.status === 'LAUNCHED' ? 'green' : 'blue'}
                        />
                      </div>
                      <p className="text-muted-foreground mt-3 line-clamp-3 text-sm">
                        {activity.description ?? 'No description yet.'}
                      </p>
                      <div className="text-muted-foreground mt-4 grid grid-cols-2 gap-2 text-xs">
                        <span>
                          Type: {getMarketingLabel(MARKETING_ACTIVITY_TYPES, activity.type)}
                        </span>
                        <span>
                          Budget:{' '}
                          {activity.budget ? `${activity.budget} ${activity.currency}` : '—'}
                        </span>
                        <span>Account: {activity.account?.name ?? 'Not linked'}</span>
                        <span>Expense: {activity.expenseCardId ? 'Linked' : 'Missing link'}</span>
                        <span>Start: {activity.startDate?.slice(0, 10) ?? 'Not scheduled'}</span>
                        <span>Pay by: {activity.expectedPayAt?.slice(0, 10) ?? 'Not set'}</span>
                      </div>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-muted-foreground text-xs">
                          {activity.expenseCardId
                            ? 'Finance expense proposed. Payment is controlled in Finance.'
                            : 'Without a Finance expense link, paid spend analytics stay incomplete.'}
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
