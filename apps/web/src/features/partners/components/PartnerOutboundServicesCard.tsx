'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Handshake } from 'lucide-react';
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
import { getApiErrorMessage } from '@/lib/api-errors';
import { partnersApi, type PartnerServiceTerm } from '@/lib/api/partners';

const SERVICE_TYPE_OPTIONS = ['SEO', 'SMM', 'ADS', 'OTHER'] as const;
const PAYMENT_MODEL_OPTIONS = ['ONE_TIME', 'MONTHLY', 'CUSTOM'] as const;

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase();
}

export function PartnerOutboundServicesCard(props: { partnerId: string; reloadKey?: number }) {
  const { partnerId, reloadKey = 0 } = props;
  const [rows, setRows] = useState<PartnerServiceTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [creatingFinanceId, setCreatingFinanceId] = useState<string | null>(null);
  const [form, setForm] = useState({
    projectId: '',
    serviceType: 'SEO',
    paymentModel: 'ONE_TIME',
    amount: '',
    billingStartDate: '',
    notes: '',
  });

  const canSubmit = useMemo(() => {
    const amount = Number(form.amount);
    return Number.isFinite(amount) && amount > 0;
  }, [form.amount]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await partnersApi.listServiceTerms(partnerId);
      setRows(data);
    } catch (caught) {
      setRows([]);
      setError(getApiErrorMessage(caught, 'Outbound service terms could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    setActionError(null);
    try {
      await partnersApi.createServiceTerm(partnerId, {
        projectId: form.projectId.trim() || null,
        serviceType: form.serviceType as (typeof SERVICE_TYPE_OPTIONS)[number],
        paymentModel: form.paymentModel as (typeof PAYMENT_MODEL_OPTIONS)[number],
        amount: Number(form.amount),
        billingStartDate: form.billingStartDate || undefined,
        notes: form.notes.trim() || undefined,
      });
      setForm({
        projectId: '',
        serviceType: 'SEO',
        paymentModel: 'ONE_TIME',
        amount: '',
        billingStartDate: '',
        notes: '',
      });
      await load();
    } catch (caught) {
      setActionError(getApiErrorMessage(caught, 'Service term could not be created.'));
    } finally {
      setSaving(false);
    }
  };

  const createFinance = async (termId: string) => {
    if (creatingFinanceId) return;
    setCreatingFinanceId(termId);
    setActionError(null);
    try {
      await partnersApi.createFinanceFromServiceTerm(partnerId, termId);
      await load();
    } catch (caught) {
      setActionError(getApiErrorMessage(caught, 'Finance entry could not be created.'));
    } finally {
      setCreatingFinanceId(null);
    }
  };

  if (loading) {
    return (
      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-sm">Loading outbound services…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => void load()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <Handshake size={16} className="text-muted-foreground" />
        <h2 className="text-foreground text-sm font-semibold">Outbound services</h2>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        Terms where partner pays Neetrino. Create a service case, then generate Finance invoice or
        partner-service subscription from it.
      </p>

      {actionError ? (
        <p className="text-destructive mt-3 text-xs" role="alert">
          {actionError}
        </p>
      ) : null}

      <form className="border-border mt-4 grid gap-3 rounded-lg border p-3" onSubmit={submit}>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <Label htmlFor="pst-project-id">Project ID (required for Finance create)</Label>
            <Input
              id="pst-project-id"
              value={form.projectId}
              onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
              placeholder="project uuid"
            />
          </div>
          <div>
            <Label htmlFor="pst-amount">Amount *</Label>
            <Input
              id="pst-amount"
              type="number"
              min={0}
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div>
            <Label>Service type</Label>
            <Select
              value={form.serviceType}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, serviceType: value ?? prev.serviceType }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPE_OPTIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Payment model</Label>
            <Select
              value={form.paymentModel}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, paymentModel: value ?? prev.paymentModel }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_MODEL_OPTIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pst-billing-start">Billing start date</Label>
            <Input
              id="pst-billing-start"
              type="datetime-local"
              value={form.billingStartDate}
              onChange={(e) => setForm((prev) => ({ ...prev, billingStartDate: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="pst-notes">Notes</Label>
          <Textarea
            id="pst-notes"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Optional terms and agreement notes"
            rows={2}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={!canSubmit || saving}>
            {saving ? 'Creating…' : 'Create service term'}
          </Button>
        </div>
      </form>

      {rows.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">No outbound service terms yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[940px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-xs tracking-wide uppercase">
                <th className="pr-3 pb-2 font-medium">Created</th>
                <th className="pr-3 pb-2 font-medium">Type</th>
                <th className="pr-3 pb-2 font-medium">Model</th>
                <th className="pr-3 pb-2 text-right font-medium">Amount</th>
                <th className="pr-3 pb-2 font-medium">Project</th>
                <th className="pr-3 pb-2 font-medium">Invoice</th>
                <th className="pr-3 pb-2 font-medium">Subscription</th>
                <th className="pr-3 pb-2 font-medium">Status</th>
                <th className="pb-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const canMaterialize =
                  !row.invoiceId &&
                  !row.subscriptionId &&
                  row.status !== 'CANCELLED' &&
                  row.status !== 'COMPLETED';
                return (
                  <tr key={row.id} className="border-border border-b last:border-0">
                    <td className="text-muted-foreground py-2 pr-3 align-top text-xs tabular-nums">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="py-2 pr-3 align-top">{row.serviceType}</td>
                    <td className="py-2 pr-3 align-top">{row.paymentModel}</td>
                    <td className="py-2 pr-3 text-right align-top font-medium tabular-nums">
                      {row.amount}
                    </td>
                    <td className="py-2 pr-3 align-top font-mono text-xs">
                      {row.projectId ? `${row.projectId.slice(0, 8)}…` : '—'}
                    </td>
                    <td className="py-2 pr-3 align-top font-mono text-xs">
                      {row.invoiceId ? `${row.invoiceId.slice(0, 8)}…` : '—'}
                    </td>
                    <td className="py-2 pr-3 align-top font-mono text-xs">
                      {row.subscriptionId ? `${row.subscriptionId.slice(0, 8)}…` : '—'}
                    </td>
                    <td className="py-2 pr-3 align-top text-xs capitalize">
                      {statusLabel(row.status)}
                    </td>
                    <td className="py-2 text-right align-top">
                      {canMaterialize ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={creatingFinanceId !== null}
                          onClick={() => void createFinance(row.id)}
                        >
                          {creatingFinanceId === row.id ? 'Creating…' : 'Create finance'}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
