'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LEAD_SOURCES, INTEREST_TYPES } from '../constants/leadPipeline';
import { leadsApi } from '@/lib/api/leads';
import { marketingApi, type AttributionOption } from '@/lib/api/marketing';

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateLeadDialog({ open, onOpenChange, onCreated }: CreateLeadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    source: 'MARKETING',
    sourceDetail: '',
    attributionOption: '',
    interestType: '',
    estimatedBudget: '',
    notes: '',
  });

  const canSubmit = form.contactName && (form.phone || form.email) && form.source;

  const reset = () => {
    setForm({
      name: '',
      contactName: '',
      phone: '',
      email: '',
      source: 'MARKETING',
      sourceDetail: '',
      attributionOption: '',
      interestType: '',
      estimatedBudget: '',
      notes: '',
    });
  };

  const [attributionOptions, setAttributionOptions] = useState<AttributionOption[]>([]);

  useEffect(() => {
    if (form.source !== 'MARKETING' || !form.sourceDetail) {
      setAttributionOptions([]);
      return;
    }
    marketingApi
      .getAttributionOptions(form.sourceDetail)
      .then(setAttributionOptions)
      .catch(() => setAttributionOptions([]));
  }, [form.source, form.sourceDetail]);

  const selectedAttribution = attributionOptions.find(
    (option) => `${option.type}:${option.id}` === form.attributionOption,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await leadsApi.create({
        name: form.name || undefined,
        contactName: form.contactName,
        phone: form.phone || undefined,
        email: form.email || undefined,
        source: form.source,
        sourceDetail: form.sourceDetail || undefined,
        marketingAccountId:
          selectedAttribution?.type === 'ACCOUNT' ? selectedAttribution.id : undefined,
        marketingActivityId:
          selectedAttribution?.type === 'ACTIVITY' ? selectedAttribution.id : undefined,
        notes: form.notes || undefined,
      });
      onCreated();
      onOpenChange(false);
      reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Lead Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Website redesign, Mobile app"
              autoFocus
            />
          </div>

          <div>
            <Label>Contact Name *</Label>
            <Input
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              placeholder="John Smith"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone *</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+374 XX XXXXXX"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="client@example.com"
              />
            </div>
          </div>
          <p className="text-muted-foreground -mt-2 text-xs">
            * At least one contact method required
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Source *</Label>
              <Select
                value={form.source}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    source: v as string,
                    sourceDetail: '',
                    attributionOption: '',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.icon} {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Where</Label>
              <Select
                value={form.sourceDetail || undefined}
                onValueChange={(v) =>
                  setForm({ ...form, sourceDetail: v as string, attributionOption: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select channel..." />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: 'SMM', label: 'SMM' },
                    { value: 'WEBSITE', label: 'Website' },
                    { value: 'LIST_AM', label: 'List.am' },
                    { value: 'GOOGLE_ADS', label: 'Google Ads' },
                    { value: 'META_ADS', label: 'Meta Ads' },
                    { value: 'CONTENT', label: 'Content Marketing' },
                    { value: 'SEO', label: 'SEO' },
                    { value: 'OFFLINE', label: 'Offline' },
                    { value: 'OTHER', label: 'Other' },
                  ].map((channel) => (
                    <SelectItem key={channel.value} value={channel.value}>
                      {channel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.source === 'MARKETING' && form.sourceDetail && (
            <div>
              <Label>Which one</Label>
              <Select
                value={form.attributionOption || undefined}
                onValueChange={(v) => setForm({ ...form, attributionOption: v as string })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account or launched activity..." />
                </SelectTrigger>
                <SelectContent>
                  {attributionOptions.map((option) => (
                    <SelectItem
                      key={`${option.type}:${option.id}`}
                      value={`${option.type}:${option.id}`}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground mt-1 text-xs">
                Required before the lead moves beyond the first working stage for account-based
                channels.
              </p>
            </div>
          )}

          <div>
            <Label>Interest Type</Label>
            <Select
              value={form.interestType || undefined}
              onValueChange={(v) => setForm({ ...form, interestType: v as string })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {INTEREST_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Estimated Budget (AMD)</Label>
            <Input
              type="number"
              value={form.estimatedBudget}
              onChange={(e) => setForm({ ...form, estimatedBudget: e.target.value })}
              placeholder="e.g. 500000"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="What does the client need? Any additional context..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Creating...' : 'Create Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
