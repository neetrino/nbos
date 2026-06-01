'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { auditApi, type AuditLogEntry } from '@/lib/api/audit';

const AUDIT_PAGE_SIZE = 20;

function formatAuditAction(action: string): string {
  return action.replaceAll('_', ' ').toLowerCase();
}

function actorLabel(entry: AuditLogEntry): string {
  if (!entry.actor) return 'System';
  return `${entry.actor.firstName} ${entry.actor.lastName}`.trim();
}

function auditReason(changes: unknown): string | null {
  if (!changes || typeof changes !== 'object') return null;
  const reason = (changes as Record<string, unknown>).reason;
  return typeof reason === 'string' && reason.length > 0 ? reason : null;
}

export function BonusEntryAuditPanel({ bonusEntryId }: { bonusEntryId: string }) {
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const res = await auditApi.findByEntity('BonusEntry', bonusEntryId, {
          page: nextPage,
          pageSize: AUDIT_PAGE_SIZE,
        });
        setItems((prev) => (append ? [...prev, ...res.items] : res.items));
        setPage(res.meta.page);
        setTotalPages(res.meta.totalPages);
      } catch {
        if (!append) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [bonusEntryId],
  );

  useEffect(() => {
    void loadPage(1, false);
  }, [loadPage]);

  if (loading) {
    return <p className="text-muted-foreground text-xs">Loading audit…</p>;
  }
  if (items.length === 0) {
    return <p className="text-muted-foreground text-xs">No audit entries for this bonus yet.</p>;
  }

  const canLoadMore = page < totalPages;

  return (
    <div className="space-y-2">
      <ul className="text-muted-foreground max-h-40 space-y-2 overflow-y-auto text-xs">
        {items.map((entry) => {
          const reason = auditReason(entry.changes);
          return (
            <li key={entry.id}>
              <span className="text-foreground font-medium">{formatAuditAction(entry.action)}</span>
              {' · '}
              {actorLabel(entry)} · {new Date(entry.createdAt).toLocaleString()}
              {reason ? (
                <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">{reason}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
      {canLoadMore ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={loadingMore}
          onClick={() => void loadPage(page + 1, true)}
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </Button>
      ) : null}
    </div>
  );
}
