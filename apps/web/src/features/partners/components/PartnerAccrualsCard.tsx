'use client';

import { useCallback, useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  partnersApi,
  type PartnerAccrualBalance,
  type PartnerAccrualListItem,
  type PartnerPayoutBatch,
} from '@/lib/api/partners';

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
  const [balance, setBalance] = useState<PartnerAccrualBalance | null>(null);
  const [batches, setBatches] = useState<PartnerPayoutBatch[]>([]);
  const [selectedAccrualIds, setSelectedAccrualIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [approvingBatchId, setApprovingBatchId] = useState<string | null>(null);
  const [cancellingBatchId, setCancellingBatchId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      const [accrualRows, balanceRow, payoutBatches] = await Promise.all([
        partnersApi.listAccruals(partnerId),
        partnersApi.getAccrualBalance(partnerId),
        partnersApi.listPayoutBatches(partnerId),
      ]);
      setRows(accrualRows);
      setBalance(balanceRow);
      setBatches(payoutBatches);
      setSelectedAccrualIds((prev) =>
        prev.filter((id) => accrualRows.some((row) => row.id === id && row.status === 'ELIGIBLE')),
      );
    } catch (caught) {
      setRows([]);
      setBalance(null);
      setBatches([]);
      setSelectedAccrualIds([]);
      setError(getApiErrorMessage(caught, 'Accruals could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  const toggleAccrual = (accrualId: string, checked: boolean) => {
    setSelectedAccrualIds((prev) => {
      if (checked) return [...prev, accrualId];
      return prev.filter((id) => id !== accrualId);
    });
  };

  const createPayoutBatch = async () => {
    if (selectedAccrualIds.length === 0 || creatingBatch) return;
    setCreatingBatch(true);
    setActionError(null);
    try {
      await partnersApi.createPayoutBatch(partnerId, { accrualIds: selectedAccrualIds });
      setSelectedAccrualIds([]);
      await load();
    } catch (caught) {
      setActionError(getApiErrorMessage(caught, 'Payout batch could not be created.'));
    } finally {
      setCreatingBatch(false);
    }
  };

  const approvePayoutBatch = async (batchId: string) => {
    if (approvingBatchId) return;
    setApprovingBatchId(batchId);
    setActionError(null);
    try {
      await partnersApi.approvePayoutBatch(partnerId, batchId);
      await load();
    } catch (caught) {
      setActionError(getApiErrorMessage(caught, 'Payout batch could not be approved.'));
    } finally {
      setApprovingBatchId(null);
    }
  };

  const cancelPayoutBatch = async (batchId: string) => {
    if (approvingBatchId || cancellingBatchId) return;
    if (!window.confirm('Cancel this draft payout batch and release accruals back to eligible?')) {
      return;
    }
    setCancellingBatchId(batchId);
    setActionError(null);
    try {
      await partnersApi.cancelPayoutBatch(partnerId, batchId);
      await load();
    } catch (caught) {
      setActionError(getApiErrorMessage(caught, 'Payout batch could not be cancelled.'));
    } finally {
      setCancellingBatchId(null);
    }
  };

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
        Referral commission from client cash: classic after delivery and full payment; subscription
        on each paid subscription invoice.
      </p>
      {actionError ? (
        <p className="text-destructive mt-3 text-xs" role="alert">
          {actionError}
        </p>
      ) : null}

      {balance ? (
        <dl className="border-border bg-muted/30 mt-4 grid grid-cols-2 gap-2 rounded-lg border p-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground text-xs">Outstanding</dt>
            <dd className="font-medium tabular-nums">{balance.unpaidTotal}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Paid (accruals)</dt>
            <dd className="font-medium tabular-nums">{balance.paidTotal}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Eligible</dt>
            <dd className="tabular-nums">{balance.byStatus.ELIGIBLE}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">In batch</dt>
            <dd className="tabular-nums">{balance.byStatus.IN_BATCH}</dd>
          </div>
        </dl>
      ) : null}

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

      <div className="border-border mt-5 border-t pt-4">
        <h3 className="text-foreground text-sm font-semibold">Payout batches</h3>
        <p className="text-muted-foreground mt-1 text-xs">
          Select eligible accruals to create a payout batch. Approve draft batch to create a Partner
          Payout expense card.
        </p>

        {rows.filter((r) => r.status === 'ELIGIBLE').length === 0 ? (
          <p className="text-muted-foreground mt-3 text-sm">
            No eligible accruals available for payout batch creation.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-xs tracking-wide uppercase">
                  <th className="w-10 pb-2" />
                  <th className="pr-3 pb-2 font-medium">Created</th>
                  <th className="pr-3 pb-2 font-medium">Order</th>
                  <th className="pr-3 pb-2 text-right font-medium">Accrual</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((r) => r.status === 'ELIGIBLE')
                  .map((r) => (
                    <tr key={r.id} className="border-border border-b last:border-0">
                      <td className="py-2 align-top">
                        <Checkbox
                          checked={selectedAccrualIds.includes(r.id)}
                          onCheckedChange={(next) => toggleAccrual(r.id, Boolean(next))}
                          aria-label={`Select accrual ${r.id}`}
                        />
                      </td>
                      <td className="text-muted-foreground py-2 pr-3 align-top text-xs tabular-nums">
                        {formatDateTime(r.createdAt)}
                      </td>
                      <td className="py-2 pr-3 align-top font-mono text-xs">
                        {r.orderId.slice(0, 8)}…
                      </td>
                      <td className="py-2 pr-3 text-right align-top font-medium tabular-nums">
                        {r.amount}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs">
                Selected accruals: {selectedAccrualIds.length}
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => void createPayoutBatch()}
                disabled={selectedAccrualIds.length === 0 || creatingBatch}
              >
                {creatingBatch ? 'Creating…' : 'Create payout batch'}
              </Button>
            </div>
          </div>
        )}

        {batches.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-sm">No payout batches created yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-xs tracking-wide uppercase">
                  <th className="pr-3 pb-2 font-medium">Created</th>
                  <th className="pr-3 pb-2 font-medium">Batch</th>
                  <th className="pr-3 pb-2 text-right font-medium">Total</th>
                  <th className="pr-3 pb-2 text-right font-medium">Accruals</th>
                  <th className="pr-3 pb-2 font-medium">Expense</th>
                  <th className="pr-3 pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id} className="border-border border-b last:border-0">
                    <td className="text-muted-foreground py-2 pr-3 align-top text-xs tabular-nums">
                      {formatDateTime(batch.createdAt)}
                    </td>
                    <td className="py-2 pr-3 align-top font-mono text-xs">
                      {batch.id.slice(0, 8)}…
                    </td>
                    <td className="py-2 pr-3 text-right align-top font-medium tabular-nums">
                      {batch.totalAmount}
                    </td>
                    <td className="py-2 pr-3 text-right align-top tabular-nums">
                      {batch.accrualCount}
                    </td>
                    <td className="py-2 pr-3 align-top font-mono text-xs">
                      {batch.expenseId ? `${batch.expenseId.slice(0, 8)}…` : '—'}
                    </td>
                    <td className="py-2 pr-3 align-top text-xs capitalize">
                      {statusLabel(batch.status)}
                    </td>
                    <td className="py-2 text-right align-top">
                      {batch.status === 'DRAFT' ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void cancelPayoutBatch(batch.id)}
                            disabled={approvingBatchId !== null || cancellingBatchId !== null}
                          >
                            {cancellingBatchId === batch.id ? 'Cancelling…' : 'Cancel'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void approvePayoutBatch(batch.id)}
                            disabled={approvingBatchId !== null || cancellingBatchId !== null}
                          >
                            {approvingBatchId === batch.id ? 'Approving…' : 'Approve'}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
