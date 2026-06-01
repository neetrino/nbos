'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NbosMoneyInput } from '@/components/shared/NbosMoneyInput';
import { NbosDatePicker } from '@/components/shared/date-picker';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SUBSCRIPTION_BILLING_FREQUENCIES,
  SUBSCRIPTION_TYPES,
} from '@/features/finance/constants/finance';
import { TAX_STATUSES } from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import { PROJECTS_PAGE_SIZE } from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import {
  buildSubscriptionCreatePayload,
  buildSubscriptionUpdatePayload,
  EMPTY_SUBSCRIPTION_FORM,
  subscriptionToFormState,
  type SubscriptionFormState,
} from '@/features/finance/utils/subscription-form-state';
import { getApiErrorMessage } from '@/lib/api-errors';
import { subscriptionsApi, type Subscription } from '@/lib/api/finance';
import { projectsApi, type Project } from '@/lib/api/projects';
import { partnersApi, type Partner } from '@/lib/api/partners';

const PARTNERS_PAGE_SIZE = 100;

function normalizeSelectValue(value: string | null): string {
  return value ?? '';
}

interface SubscriptionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  subscription?: Subscription | null;
  onSaved: (subscription: Subscription) => void;
}

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  mode,
  subscription = null,
  onSaved,
}: SubscriptionFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<SubscriptionFormState>({ ...EMPTY_SUBSCRIPTION_FORM });
  const [projects, setProjects] = useState<Project[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    if (mode === 'edit' && subscription) {
      setForm(subscriptionToFormState(subscription));
    } else {
      setForm({ ...EMPTY_SUBSCRIPTION_FORM });
    }
  }, [open, mode, subscription]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setOptionsLoading(true);
    Promise.all([
      projectsApi.getAll({ page: 1, pageSize: PROJECTS_PAGE_SIZE }),
      partnersApi.getAll({ page: 1, pageSize: PARTNERS_PAGE_SIZE }),
    ])
      .then(([projectRes, partnerRes]) => {
        if (!cancelled) {
          setProjects(projectRes.items);
          setPartners(partnerRes.items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProjects([]);
          setPartners([]);
        }
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const parsedAmount = parseFloat(form.baseMonthlyAmount.replace(/\s/g, ''));
  const parsedBillingDay = parseInt(form.billingDay, 10);
  const canSubmit =
    (mode === 'edit' || Boolean(form.projectId)) &&
    Boolean(form.type) &&
    Boolean(form.billingStartDate) &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    Number.isFinite(parsedBillingDay) &&
    parsedBillingDay >= 1 &&
    parsedBillingDay <= 28;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setFormError(null);
    try {
      const saved =
        mode === 'edit' && subscription
          ? await subscriptionsApi.update(subscription.id, buildSubscriptionUpdatePayload(form))
          : await subscriptionsApi.create(buildSubscriptionCreatePayload(form));
      onSaved(saved);
      onOpenChange(false);
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, 'Could not save subscription.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit subscription' : 'New subscription'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          {formError ? <p className="text-destructive text-sm">{formError}</p> : null}

          {mode === 'create' ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sub-project">Project</Label>
              <Select
                value={form.projectId || undefined}
                onValueChange={(v) => setForm({ ...form, projectId: normalizeSelectValue(v) })}
                disabled={optionsLoading}
              >
                <SelectTrigger id="sub-project">
                  <SelectValue placeholder={optionsLoading ? 'Loading…' : 'Select project'} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sub-type">Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: normalizeSelectValue(v) })}
            >
              <SelectTrigger id="sub-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBSCRIPTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <NbosMoneyInput
              id="sub-amount"
              label="Base monthly amount"
              value={form.baseMonthlyAmount}
              onChange={(baseMonthlyAmount) => setForm({ ...form, baseMonthlyAmount })}
              required
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sub-frequency">Billing frequency</Label>
              <Select
                value={form.billingFrequency}
                onValueChange={(v) =>
                  setForm({ ...form, billingFrequency: normalizeSelectValue(v) })
                }
              >
                <SelectTrigger id="sub-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_BILLING_FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sub-billing-day">Billing day (1–28)</Label>
              <Input
                id="sub-billing-day"
                type="number"
                min={1}
                max={28}
                value={form.billingDay}
                onChange={(e) => setForm({ ...form, billingDay: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sub-tax">Tax status</Label>
              <Select
                value={form.taxStatus}
                onValueChange={(v) => setForm({ ...form, taxStatus: normalizeSelectValue(v) })}
              >
                <SelectTrigger id="sub-tax">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAX_STATUSES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sub-start">Billing start date</Label>
              <NbosDatePicker
                id="sub-start"
                value={form.billingStartDate}
                onChange={(billingStartDate) => setForm({ ...form, billingStartDate })}
                aria-label="Billing start date"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sub-end">End date (optional)</Label>
              <NbosDatePicker
                id="sub-end"
                value={form.endDate}
                onChange={(endDate) => setForm({ ...form, endDate })}
                clearable
                aria-label="End date"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sub-partner">Partner (optional)</Label>
            <Select
              value={form.partnerId || 'NONE'}
              onValueChange={(v) => {
                const nextValue = normalizeSelectValue(v);
                setForm({ ...form, partnerId: nextValue === 'NONE' ? '' : nextValue });
              }}
              disabled={optionsLoading}
            >
              <SelectTrigger id="sub-partner">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">None</SelectItem>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="sub-notifications"
              checked={form.notificationsEnabled}
              onCheckedChange={(checked) =>
                setForm({ ...form, notificationsEnabled: checked === true })
              }
            />
            <Label htmlFor="sub-notifications" className="font-normal">
              Enable billing notifications for this subscription
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create subscription'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
