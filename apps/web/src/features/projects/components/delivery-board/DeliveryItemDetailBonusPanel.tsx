'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { bonusesApi, type BonusEntryListRow, type BonusReleaseRow } from '@/lib/api/bonus';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  DELIVERY_BONUS_RELEASE_PAGE_SIZE,
  DELIVERY_ORDER_BONUS_PAGE_SIZE,
} from './delivery-item-detail-bonus.constants';

function BonusEntrySummary({ row }: { row: BonusEntryListRow }) {
  const who = `${row.employee.firstName} ${row.employee.lastName}`.trim();
  return (
    <div className="min-w-0 flex-1 text-left">
      <p className="text-sm font-medium">
        {row.type} · {row.status}
      </p>
      <p className="text-muted-foreground mt-0.5 text-xs">
        {who} · {row.amount} · {row.percent}%
      </p>
    </div>
  );
}

function ReleaseLine({ row }: { row: BonusReleaseRow }) {
  return (
    <li className="border-border/50 rounded-md border border-dashed bg-stone-50/60 px-2.5 py-1.5 text-xs dark:bg-stone-950/40">
      <span className="font-medium">{row.releaseType}</span>
      <span className="text-muted-foreground"> · {row.status}</span>
      <span className="text-muted-foreground"> · {row.amount}</span>
    </li>
  );
}

function EntryReleasesBlock({ entryId }: { entryId: string }) {
  const [rows, setRows] = useState<BonusReleaseRow[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const { items, meta } = await bonusesApi.listReleasesForEntryPage(entryId, {
          page: nextPage,
          pageSize: DELIVERY_BONUS_RELEASE_PAGE_SIZE,
        });
        setRows((prev) => (append ? [...prev, ...items] : items));
        setPage(meta.page);
        setTotalPages(meta.totalPages);
      } catch (caught) {
        setError(getApiErrorMessage(caught, 'Releases could not be loaded.'));
        if (!append) setRows([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [entryId],
  );

  useEffect(() => {
    void loadPage(1, false);
  }, [loadPage]);

  const onLoadMore = () => {
    if (loadingMore || page >= totalPages) return;
    void loadPage(page + 1, true);
  };

  if (loading && rows.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-2 text-xs">
        <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
        Loading releases…
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive py-1 text-xs">{error}</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground py-1 text-xs">No releases recorded for this entry yet.</p>
    );
  }

  return (
    <div className="space-y-2 pt-1">
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <ReleaseLine key={r.id} row={r} />
        ))}
      </ul>
      {page < totalPages ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-8 w-full text-xs"
          disabled={loadingMore}
          onClick={onLoadMore}
        >
          {loadingMore ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
              Loading…
            </>
          ) : (
            `Load more releases (${page} / ${totalPages})`
          )}
        </Button>
      ) : (
        <p className="text-muted-foreground text-center text-[11px]">End of release list</p>
      )}
    </div>
  );
}

function BonusEntryRow({ row }: { row: BonusEntryListRow }) {
  const [open, setOpen] = useState(false);
  const expandId = `delivery-bonus-entry-${row.id}`;

  return (
    <li className="border-border/60 rounded-xl border bg-white/60 dark:bg-stone-950/30">
      <div className="flex items-stretch gap-1">
        <button
          type="button"
          id={`${expandId}-trigger`}
          className="hover:bg-muted/40 flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors"
          aria-expanded={open}
          aria-controls={`${expandId}-panel`}
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronDown
            className={`text-muted-foreground size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
          <BonusEntrySummary row={row} />
        </button>
      </div>
      {open ? (
        <div
          id={`${expandId}-panel`}
          role="region"
          aria-labelledby={`${expandId}-trigger`}
          className="border-border/40 border-t px-3 pt-2 pb-3 pl-10"
        >
          <EntryReleasesBlock entryId={row.id} />
        </div>
      ) : null}
    </li>
  );
}

function useOrderBonusRows(orderId: string | null) {
  const [rows, setRows] = useState<BonusEntryListRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setRows([]);
      setPage(1);
      setTotalPages(1);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(1);
    void (async () => {
      try {
        const { items, meta } = await bonusesApi.getPage({
          orderId,
          pageSize: DELIVERY_ORDER_BONUS_PAGE_SIZE,
          page: 1,
        });
        if (!cancelled) {
          setRows(items);
          setTotalPages(meta.totalPages);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(getApiErrorMessage(caught, 'Could not load bonus entries.'));
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const loadMore = useCallback(async () => {
    if (!orderId || loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    setError(null);
    try {
      const next = page + 1;
      const { items, meta } = await bonusesApi.getPage({
        orderId,
        pageSize: DELIVERY_ORDER_BONUS_PAGE_SIZE,
        page: next,
      });
      setRows((prev) => [...prev, ...items]);
      setPage(meta.page);
      setTotalPages(meta.totalPages);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not load more bonus entries.'));
    } finally {
      setLoadingMore(false);
    }
  }, [orderId, loadingMore, page, totalPages]);

  return { rows, loading, loadingMore, error, page, totalPages, loadMore };
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
  page,
  totalPages,
  loadingMore,
  loadMore,
}: {
  rows: BonusEntryListRow[];
  financeTabHref: string;
  page: number;
  totalPages: number;
  loadingMore: boolean;
  loadMore: () => void;
}) {
  const shown = rows.length;
  const hasMore = page < totalPages;

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-xs leading-relaxed">
        {hasMore
          ? `Showing ${shown} loaded entries (page ${page} of ${totalPages}). Expand a row for release ledger.`
          : `All ${shown} entr${shown === 1 ? 'y' : 'ies'} for this order. Expand a row for releases.`}
      </p>
      <ul className="space-y-2">
        {rows.map((row) => (
          <BonusEntryRow key={row.id} row={row} />
        ))}
      </ul>
      {hasMore ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-xs"
          disabled={loadingMore}
          onClick={() => void loadMore()}
        >
          {loadingMore ? (
            <>
              <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden />
              Loading…
            </>
          ) : (
            'Load more entries'
          )}
        </Button>
      ) : null}
      <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
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
  const { rows, loading, loadingMore, error, page, totalPages, loadMore } =
    useOrderBonusRows(orderId);

  if (!orderId) return <BonusPanelNoOrder financeTabHref={financeTabHref} />;
  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        Loading bonus entries…
      </div>
    );
  }
  if (error) return <p className="text-destructive text-sm">{error}</p>;
  if (rows.length === 0)
    return <BonusPanelEmptyList orderId={orderId} financeTabHref={financeTabHref} />;
  return (
    <BonusPanelList
      rows={rows}
      financeTabHref={financeTabHref}
      page={page}
      totalPages={totalPages}
      loadingMore={loadingMore}
      loadMore={loadMore}
    />
  );
}
