'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRevalidationState } from '@/hooks/use-revalidation-state';
import { getApiErrorMessage, isAccessRevokedApiError } from '@/lib/api-errors';
import { PartnerDetailCardFrame } from './PartnerDetailCardFrame';
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
  const dataRef = useRef(data);
  dataRef.current = data;
  const loadedPartnerIdRef = useRef<string | null>(null);
  const [loadedPartnerId, setLoadedPartnerId] = useState<string | null>(null);
  const { loading, begin: beginLoad, end: endLoad } = useRevalidationState();
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    beginLoad(loadedPartnerIdRef.current === partnerId && dataRef.current != null);
    setError(null);
    try {
      const res = await partnersApi.getAnalytics(partnerId);
      setData(res);
      loadedPartnerIdRef.current = partnerId;
      setLoadedPartnerId(partnerId);
    } catch (caught) {
      if (isAccessRevokedApiError(caught) || loadedPartnerIdRef.current !== partnerId) {
        setData(null);
        loadedPartnerIdRef.current = null;
        setLoadedPartnerId(null);
      }
      setError(getApiErrorMessage(caught, 'Analytics could not be loaded.'));
    } finally {
      endLoad();
    }
  }, [beginLoad, endLoad, partnerId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PartnerDetailCardFrame
      loading={loading}
      error={error}
      hasData={loadedPartnerId === partnerId && data != null}
      loadingLabel="Loading analytics…"
      onRetry={() => void load()}
      onDismissError={() => setError(null)}
    >
      {data ? (
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
            <Metric
              label="Paid partner payouts"
              value={formatMoneyString(data.paidPartnerPayouts)}
            />
            <Metric
              label="Outbound partner revenue (paid)"
              value={formatMoneyString(data.outboundPartnerRevenue)}
            />
          </div>
        </div>
      ) : null}
    </PartnerDetailCardFrame>
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
