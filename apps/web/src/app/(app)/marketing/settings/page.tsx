'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCcw, SlidersHorizontal } from 'lucide-react';
import { PageHeader, EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/shared';
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
import { marketingApi, type MarketingAccount } from '@/lib/api/marketing';
import {
  MARKETING_ACCOUNT_STATUSES,
  MARKETING_CHANNELS,
  getMarketingLabel,
} from '@/features/marketing/constants';

export default function MarketingSettingsPage() {
  const [accounts, setAccounts] = useState<MarketingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    channel: 'LIST_AM',
    name: '',
    identifier: '',
    phone: '',
  });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      setAccounts(await marketingApi.getAccounts());
      setError(null);
    } catch {
      setError('Marketing accounts could not be loaded.');
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing Settings"
        description="Channels and accounts that power CRM attribution."
      >
        <Button variant="outline" size="icon" onClick={fetchAccounts}>
          <RefreshCcw size={16} />
        </Button>
      </PageHeader>

      <form
        onSubmit={handleCreate}
        className="border-border bg-card grid gap-4 rounded-2xl border p-5 md:grid-cols-5"
      >
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
          <Label>Account name</Label>
          <Input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="List.am Account 1"
          />
        </div>
        <div>
          <Label>Identifier</Label>
          <Input
            value={form.identifier}
            onChange={(event) => setForm({ ...form, identifier: event.target.value })}
            placeholder="@page or account id"
          />
        </div>
        <div>
          <Label>Phone</Label>
          <Input
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            placeholder="+374..."
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={saving || !form.name.trim()} className="w-full">
            <Plus size={16} />
            {saving ? 'Adding...' : 'Add account'}
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
          title="No marketing accounts yet"
          description="Add List.am accounts, social pages, or website sources to unlock Which one attribution."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <div key={account.id} className="border-border bg-card rounded-2xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{account.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {getMarketingLabel(MARKETING_CHANNELS, account.channel)}
                  </p>
                </div>
                <StatusBadge
                  label={getMarketingLabel(MARKETING_ACCOUNT_STATUSES, account.status)}
                  variant={account.status === 'ACTIVE' ? 'green' : 'gray'}
                />
              </div>
              <div className="text-muted-foreground mt-4 space-y-1 text-sm">
                <p>Identifier: {account.identifier ?? 'Not set'}</p>
                <p>Phone: {account.phone ?? 'Not set'}</p>
                <p>
                  Finance link:{' '}
                  {account.financeExpensePlanId ? 'Expense plan linked' : 'Missing finance link'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
