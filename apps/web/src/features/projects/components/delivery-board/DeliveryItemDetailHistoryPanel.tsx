'use client';

import { useEffect, useState } from 'react';
import { auditApi, type AuditLogEntry } from '@/lib/api/audit';
import { getApiErrorMessage } from '@/lib/api-errors';

const HISTORY_PAGE_SIZE = 50;

function formatActor(entry: AuditLogEntry): string {
  if (entry.actor) {
    return `${entry.actor.firstName} ${entry.actor.lastName}`.trim();
  }
  return `User ${entry.userId.slice(0, 8)}…`;
}

function formatChanges(changes: unknown): string | null {
  if (changes === null || changes === undefined) return null;
  if (typeof changes === 'string') return changes;
  try {
    return JSON.stringify(changes);
  } catch {
    return null;
  }
}

interface DeliveryItemDetailHistoryPanelProps {
  entityType: 'PRODUCT' | 'EXTENSION';
  entityId: string;
}

export function DeliveryItemDetailHistoryPanel({
  entityType,
  entityId,
}: DeliveryItemDetailHistoryPanelProps) {
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const run = async () => {
      try {
        const res = await auditApi.findByEntity(entityType, entityId, {
          page: 1,
          pageSize: HISTORY_PAGE_SIZE,
        });
        if (!cancelled) setItems(res.items);
      } catch (caught) {
        if (!cancelled) {
          setError(getApiErrorMessage(caught, 'Could not load audit history.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading history…</p>;
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No audit events for this delivery item yet. Completion and cancellation actions are logged
        automatically; older transitions may not have entries.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((entry) => {
        const changesText = formatChanges(entry.changes);
        return (
          <li
            key={entry.id}
            className="border-border/60 rounded-lg border bg-white/40 px-3 py-2 text-sm dark:bg-stone-950/20"
          >
            <p className="font-medium">{entry.action}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {new Date(entry.createdAt).toLocaleString()} · {formatActor(entry)}
            </p>
            {changesText ? (
              <p className="text-muted-foreground mt-2 font-mono text-xs break-words">
                {changesText}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
