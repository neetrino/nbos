'use client';

import { useEffect, useState } from 'react';
import { Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  marketingApi,
  type LaunchMarketingActivityPayload,
  type MarketingAccount,
  type MarketingActivity,
} from '@/lib/api/marketing';

interface MarketingLaunchDialogProps {
  activity: MarketingActivity;
  accounts: MarketingAccount[];
  onLaunched: () => Promise<void>;
}

export function MarketingLaunchDialog({
  activity,
  accounts,
  onLaunched,
}: MarketingLaunchDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    startDate: activity.startDate?.slice(0, 10) ?? '',
    endDate: activity.endDate?.slice(0, 10) ?? '',
    budget: activity.budget?.toString() ?? '',
    expectedPayAt: activity.expectedPayAt?.slice(0, 10) ?? '',
    accountId: activity.accountId ?? '',
    noExpenseReason: '',
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      startDate: activity.startDate?.slice(0, 10) ?? '',
      endDate: activity.endDate?.slice(0, 10) ?? '',
      budget: activity.budget?.toString() ?? '',
      expectedPayAt: activity.expectedPayAt?.slice(0, 10) ?? '',
      accountId: activity.accountId ?? '',
      noExpenseReason: '',
    });
    setError(null);
  }, [activity, open]);

  const channelAccounts = accounts.filter((account) => account.channel === activity.channel);

  const handleLaunch = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await marketingApi.launchActivity(activity.id, buildPayload());
      setOpen(false);
      await onLaunched();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activity could not be launched.');
    } finally {
      setSaving(false);
    }
  };

  const buildPayload = (): LaunchMarketingActivityPayload => ({
    startDate: form.startDate,
    endDate: form.endDate || null,
    budget: form.budget ? Number(form.budget) : null,
    expectedPayAt: form.expectedPayAt || null,
    accountId: form.accountId || null,
    noExpenseReason: form.noExpenseReason || null,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button size="sm" variant="outline" disabled={activity.status === 'LAUNCHED'} />}
      >
        <Rocket size={14} />
        Launch
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleLaunch} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Launch activity</DialogTitle>
            <DialogDescription>
              Validate launch fields and propose a Finance expense card when spend is expected.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Start date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(event) => setForm({ ...form, startDate: event.target.value })}
                required
              />
            </div>
            <div>
              <Label>End date</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              />
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
            <div>
              <Label>Expected payment date</Label>
              <Input
                type="date"
                value={form.expectedPayAt}
                onChange={(event) => setForm({ ...form, expectedPayAt: event.target.value })}
              />
            </div>
          </div>

          {activity.channel === 'LIST_AM' && (
            <div>
              <Label>List.am account</Label>
              <Select
                value={form.accountId}
                onValueChange={(accountId) => setForm({ ...form, accountId: accountId ?? '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {channelAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>No-expense reason</Label>
            <Textarea
              value={form.noExpenseReason}
              onChange={(event) => setForm({ ...form, noExpenseReason: event.target.value })}
              placeholder="Use when activity has no Finance expense proposal."
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? 'Launching...' : 'Launch activity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
