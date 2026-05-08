'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { bonusesApi, type BonusEntryListRow } from '@/lib/api/bonus';
import { getApiErrorMessage } from '@/lib/api-errors';

const ORDER_BONUS_PAGE_SIZE = 40;

function BonusEntryLine({ row }: { row: BonusEntryListRow }) {
  const who = `${row.employee.firstName} ${row.employee.lastName}`.trim();
  return (
    <li className="border-border/60 rounded-lg border bg-white/50 px-3 py-2 text-sm dark:bg-stone-950/25">
      <p className="font-medium">
        {row.type} · {row.status}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">
        {who} · {row.amount} · {row.percent}%
      </p>
    </li>
  );
}

function useOrderBonusRows(orderId: string | null) {
  const [rows, setRows] = useState<BonusEntryListRow[]>([]);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const { items } = await bonusesApi.getPage({
          orderId,
          pageSize: ORDER_BONUS_PAGE_SIZE,
          page: 1,
        });
        if (!cancelled) setRows(items);
      } catch (caught) {
        if (!cancelled) {
          setError(getApiErrorMessage(caught, 'Could not load bonus entries.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return { rows, loading, error };
}

function BonusPanelNoOrder({ financeTabHref }: { financeTabHref: string }) {
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Bonus entries are tied to a finance order. This delivery line has no linked order yet.
      </p>
      <Link
        href={financeTabHref}
        className="text-primary inline-block text-sm font-semibold hover:underline"
      >
        Open Finance tab →
      </Link>
    </div>
  );
}

function BonusPanelEmptyList({
  orderId,
  financeTabHref,
}: {
  orderId: string;
  financeTabHref: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        No bonus entries for order <span className="font-mono text-xs">{orderId.slice(0, 8)}…</span>{' '}
        yet. Accruals appear when finance and delivery events create them.
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <Link href="/bonus" className="text-primary text-sm font-semibold hover:underline">
          Open Bonus Board →
        </Link>
        <Link href={financeTabHref} className="text-primary text-sm font-semibold hover:underline">
          Finance tab →
        </Link>
      </div>
    </div>
  );
}

function BonusPanelList({
  rows,
  financeTabHref,
}: {
  rows: BonusEntryListRow[];
  financeTabHref: string;
}) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-xs">
        Showing up to {ORDER_BONUS_PAGE_SIZE} entries for this order (all types). Release detail
        stays on the Bonus Board.
      </p>
      <ul className="max-h-[min(24rem,50vh)] space-y-2 overflow-y-auto pr-1">
        {rows.map((row) => (
          <BonusEntryLine key={row.id} row={row} />
        ))}
      </ul>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <Link href="/bonus" className="text-primary text-sm font-semibold hover:underline">
          Full Bonus Board →
        </Link>
        <Link href={financeTabHref} className="text-primary text-sm font-semibold hover:underline">
          Finance tab →
        </Link>
      </div>
    </div>
  );
}

export function DeliveryItemDetailBonusPanel({
  orderId,
  financeTabHref,
}: {
  orderId: string | null;
  financeTabHref: string;
}) {
  const { rows, loading, error } = useOrderBonusRows(orderId);

  if (!orderId) return <BonusPanelNoOrder financeTabHref={financeTabHref} />;
  if (loading) return <p className="text-muted-foreground text-sm">Loading bonus entries…</p>;
  if (error) return <p className="text-destructive text-sm">{error}</p>;
  if (rows.length === 0)
    return <BonusPanelEmptyList orderId={orderId} financeTabHref={financeTabHref} />;
  return <BonusPanelList rows={rows} financeTabHref={financeTabHref} />;
}
