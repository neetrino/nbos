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

function currentPayrollMonth(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function MarketingBonusAccrualPreviewPanel() {
  const [month, setMonth] = useState(currentPayrollMonth);
  const [preview, setPreview] = useState<MarketingBonusAccrualPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await marketingBonusAccrualApi.preview(month.trim());
      setPreview(data);
    } catch (caught) {
      setPreview(null);
      setError(getApiErrorMessage(caught, 'Could not load marketing accrual preview.'));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="border-border bg-card rounded-xl border p-4">
      <h2 className="text-foreground text-sm font-semibold">Marketing bonus accrual (preview)</h2>
      <p className="text-muted-foreground mt-1 text-xs leading-snug">
        Counts attributed MQL/SQL leads created in the payroll month (UTC). Does not create bonus
        entries — use manual MARKETING lines until apply flow ships.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Payroll month</span>
          <Input
            className="w-36"
            value={month}
            disabled={loading}
            placeholder="YYYY-MM"
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => void load()}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>
      {error ? <p className="text-destructive mt-2 text-sm">{error}</p> : null}
      {preview ? (
        <div className="mt-3 space-y-2 text-sm">
          <p className="text-muted-foreground text-xs">{preview.note}</p>
          {!preview.ratesConfigured ? (
            <p className="text-muted-foreground text-xs">
              Rates: SQL {formatAmount(preview.amountPerSql)} · MQL{' '}
              {formatAmount(preview.amountPerMql)} (configure in API constants to enable suggested
              totals).
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">
              Rates: SQL {formatAmount(preview.amountPerSql)} · MQL{' '}
              {formatAmount(preview.amountPerMql)}
            </p>
          )}
          <p className="text-foreground tabular-nums">
            Totals: {preview.totals.mqlCount} MQL · {preview.totals.sqlCount} SQL
            {preview.ratesConfigured ? (
              <> · suggested {formatAmount(preview.totals.suggestedAmount)}</>
            ) : null}
          </p>
          {preview.rows.length === 0 ? (
            <p className="text-muted-foreground text-xs">No attributed leads in this month.</p>
          ) : (
            <ul className="divide-border divide-y rounded-lg border">
              {preview.rows.map((row) => (
                <li
                  key={row.employeeId}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs"
                >
                  <span className="text-foreground font-medium">
                    {row.firstName} {row.lastName}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {row.mqlCount} MQL · {row.sqlCount} SQL
                    {preview.ratesConfigured ? <> · {formatAmount(row.suggestedAmount)}</> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
