'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Plus, RefreshCcw } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/shared';
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
import { Textarea } from '@/components/ui/textarea';
import { marketingApi, type MarketingActivity } from '@/lib/api/marketing';
import {
  MARKETING_ACTIVITY_STATUSES,
  MARKETING_ACTIVITY_TYPES,
  MARKETING_CHANNELS,
  getMarketingLabel,
} from '@/features/marketing/constants';

export default function MarketingPage() {
  const [activities, setActivities] = useState<MarketingActivity[]>([]);
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
      setActivities(await marketingApi.getActivities());
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
        <Button variant="outline" size="icon" onClick={fetchActivities}>
          <RefreshCcw size={16} />
        </Button>
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activities.map((activity) => (
            <div key={activity.id} className="border-border bg-card rounded-2xl border p-4">
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
              <p className="text-muted-foreground mt-3 text-sm">
                {activity.description ?? 'No description yet.'}
              </p>
              <div className="text-muted-foreground mt-4 grid grid-cols-2 gap-2 text-xs">
                <span>Type: {getMarketingLabel(MARKETING_ACTIVITY_TYPES, activity.type)}</span>
                <span>Budget: {activity.budget ?? 'No spend data'}</span>
                <span>Account: {activity.account?.name ?? 'Not linked'}</span>
                <span>Expense: {activity.expenseCardId ? 'Linked' : 'Missing link'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
