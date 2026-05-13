'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-errors';
import { partnersApi, type PartnerAnalytics } from '@/lib/api/partners';

function formatMoneyString(value: string): string {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatConversionRate(rate: string | null): string {
  if (rate == null) return '—';
  const n = parseFloat(rate);
  if (Number.isNaN(n)) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

export function PartnerAnalyticsCard(props: { partnerId: string }) {
  const { partnerId } = props;
  const [data, setData] = useState<PartnerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await partnersApi.getAnalytics(partnerId);
      setData(res);
    } catch (caught) {
      setData(null);
      setError(getApiErrorMessage(caught, 'Analytics could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-sm">Loading analytics…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-destructive text-sm" role="alert">
          {error ?? 'No data'}
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-muted-foreground" />
          <h2 className="text-foreground text-sm font-semibold">Analytics</h2>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        Inbound funnel (partner-sourced CRM), referred client paid revenue, accrual rollups, and
        outbound cash collected on linked invoices.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Referred leads" value={String(data.referredLeadCount)} />
        <Metric label="Partner deals" value={String(data.partnerDealCount)} />
        <Metric label="Won deals" value={String(data.wonDealCount)} />
        <Metric label="Deal win rate" value={formatConversionRate(data.dealConversionRate)} />
        <Metric
          label="Referred client revenue (paid)"
          value={formatMoneyString(data.referredClientRevenue)}
        />
        <Metric
          label="Accrued partner payouts"
          value={formatMoneyString(data.accruedPartnerPayouts)}
        />
        <Metric label="Paid partner payouts" value={formatMoneyString(data.paidPartnerPayouts)} />
        <Metric
          label="Outbound partner revenue (paid)"
          value={formatMoneyString(data.outboundPartnerRevenue)}
        />
      </div>
    </div>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="border-border rounded-lg border p-3">
      <p className="text-muted-foreground text-xs">{props.label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{props.value}</p>
    </div>
  );
}
