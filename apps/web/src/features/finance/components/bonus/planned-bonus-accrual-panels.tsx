'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatAmount } from '@/features/finance/constants/finance';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  marketingBonusAccrualApi,
  type MarketingBonusAccrualPreview,
} from '@/lib/api/marketing-bonus-accrual';
import {
  supportBonusAccrualApi,
  type SupportBonusAccrualPreview,
} from '@/lib/api/support-bonus-accrual';

function currentPayrollMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function PlannedBonusAccrualPanels({ onApplied }: { onApplied?: () => void }) {
  const [month, setMonth] = useState(currentPayrollMonth);
  const [marketing, setMarketing] = useState<MarketingBonusAccrualPreview | null>(null);
  const [support, setSupport] = useState<SupportBonusAccrualPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<'marketing' | 'support' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setApplyMsg(null);
    try {
      const [m, s] = await Promise.all([
        marketingBonusAccrualApi.preview(month.trim()),
        supportBonusAccrualApi.preview(month.trim()),
      ]);
      setMarketing(m);
      setSupport(s);
    } catch (caught) {
      setMarketing(null);
      setSupport(null);
      setError(getApiErrorMessage(caught, 'Could not load accrual preview.'));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyMarketing = async () => {
    if (!marketing?.ratesConfigured) return;
    setApplying('marketing');
    setApplyMsg(null);
    try {
      const result = await marketingBonusAccrualApi.apply(month.trim());
      setApplyMsg(
        `Marketing: created ${result.created}, skipped ${result.skipped} (anchor ${result.anchor.projectCode} / ${result.anchor.orderCode}).`,
      );
      onApplied?.();
      await load();
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Marketing apply failed.'));
    } finally {
      setApplying(null);
    }
  };

  const applySupport = async () => {
    if (!support?.ratesConfigured) return;
    setApplying('support');
    setApplyMsg(null);
    try {
      const result = await supportBonusAccrualApi.apply(month.trim());
      setApplyMsg(
        `Support: created ${result.created}, skipped ${result.skipped} (anchor ${result.anchor.projectCode} / ${result.anchor.orderCode}).`,
      );
      onApplied?.();
      await load();
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Support apply failed.'));
    } finally {
      setApplying(null);
    }
  };

  return (
    <section className="border-border bg-card space-y-4 rounded-xl border p-4">
      <div>
        <h2 className="text-foreground text-sm font-semibold">Planned bonus accrual (§4b)</h2>
        <p className="text-muted-foreground mt-1 text-xs leading-snug">
          Marketing: MQL/SQL leads. Support: tickets resolved in month within SLA. Apply creates
          INCOMING MARKETING entries on the company anchor order (one per employee per month).
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Payroll month</span>
          <Input
            className="w-36"
            value={month}
            disabled={loading || applying != null}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading || applying != null}
          onClick={() => void load()}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {applyMsg ? <p className="text-foreground text-sm">{applyMsg}</p> : null}

      {marketing ? (
        <div className="border-border rounded-lg border p-3">
          <h3 className="text-foreground text-xs font-semibold tracking-wide uppercase">
            Marketing
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">{marketing.note}</p>
          <p className="text-foreground mt-2 text-xs tabular-nums">
            {marketing.totals.mqlCount} MQL · {marketing.totals.sqlCount} SQL
            {marketing.ratesConfigured ? (
              <> · {formatAmount(marketing.totals.suggestedAmount)}</>
            ) : null}
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-2"
            disabled={!marketing.ratesConfigured || applying != null || marketing.rows.length === 0}
            onClick={() => void applyMarketing()}
          >
            {applying === 'marketing' ? 'Applying…' : 'Apply marketing accrual'}
          </Button>
        </div>
      ) : null}

      {support ? (
        <div className="border-border rounded-lg border p-3">
          <h3 className="text-foreground text-xs font-semibold tracking-wide uppercase">Support</h3>
          <p className="text-muted-foreground mt-1 text-xs">{support.note}</p>
          <p className="text-foreground mt-2 text-xs tabular-nums">
            {support.totals.slaMetCount} SLA-met
            {support.ratesConfigured ? (
              <> · {formatAmount(support.totals.suggestedAmount)}</>
            ) : null}
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-2"
            disabled={!support.ratesConfigured || applying != null || support.rows.length === 0}
            onClick={() => void applySupport()}
          >
            {applying === 'support' ? 'Applying…' : 'Apply support accrual'}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
