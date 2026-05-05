'use client';

import { useCallback, useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-errors';
import { partnersApi, type PartnerAccrualListItem } from '@/lib/api/partners';

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

export function PartnerAccrualsCard(props: { partnerId: string; reloadKey?: number }) {
  const { partnerId, reloadKey = 0 } = props;
  const [rows, setRows] = useState<PartnerAccrualListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await partnersApi.listAccruals(partnerId);
      setRows(data);
    } catch (caught) {
      setRows([]);
      setError(getApiErrorMessage(caught, 'Accruals could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  if (loading) {
    return (
      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-sm">Loading accruals…</p>
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
        <Wallet size={16} className="text-muted-foreground" />
        <h2 className="text-foreground text-sm font-semibold">Inbound accruals</h2>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        Referral commission accruals from client payments (classic when delivery is done;
        subscription accruals will appear here as they are implemented).
      </p>

      {rows.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">
          No accruals recorded for this partner yet.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-xs tracking-wide uppercase">
                <th className="pr-3 pb-2 font-medium">Created</th>
                <th className="pr-3 pb-2 font-medium">Order</th>
                <th className="pr-3 pb-2 font-medium">Deal</th>
                <th className="pr-3 pb-2 font-medium">Pay</th>
                <th className="pr-3 pb-2 text-right font-medium">Base</th>
                <th className="pr-3 pb-2 text-right font-medium">%</th>
                <th className="pr-3 pb-2 text-right font-medium">Accrual</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-border border-b last:border-0">
                  <td className="text-muted-foreground py-2 pr-3 align-top text-xs tabular-nums">
                    {formatDateTime(r.createdAt)}
                  </td>
                  <td className="py-2 pr-3 align-top font-mono text-xs" title={r.orderId}>
                    {r.orderId.slice(0, 8)}…
                  </td>
                  <td className="py-2 pr-3 align-top">{r.dealType}</td>
                  <td className="py-2 pr-3 align-top">{r.paymentType}</td>
                  <td className="py-2 pr-3 text-right align-top tabular-nums">{r.baseAmount}</td>
                  <td className="py-2 pr-3 text-right align-top tabular-nums">{r.percent}</td>
                  <td className="py-2 pr-3 text-right align-top font-medium tabular-nums">
                    {r.amount}
                  </td>
                  <td className="py-2 align-top text-xs capitalize">{statusLabel(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
