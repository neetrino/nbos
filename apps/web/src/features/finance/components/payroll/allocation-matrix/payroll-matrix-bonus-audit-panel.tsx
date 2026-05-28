'use client';

import { useEffect, useState } from 'react';
import { auditApi, type AuditLogEntry } from '@/lib/api/audit';

function formatAuditAction(action: string): string {
  return action.replaceAll('_', ' ').toLowerCase();
}

function actorLabel(entry: AuditLogEntry): string {
  if (!entry.actor) return 'System';
  return `${entry.actor.firstName} ${entry.actor.lastName}`.trim();
}

export function PayrollMatrixBonusAuditPanel({ bonusEntryId }: { bonusEntryId: string }) {
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void auditApi
      .findByEntity('BonusEntry', bonusEntryId, { page: 1, pageSize: 10 })
      .then((res) => {
        if (!cancelled) setItems(res.items);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bonusEntryId]);

  if (loading) {
    return <p className="text-muted-foreground text-xs">Loading audit…</p>;
  }
  if (items.length === 0) {
    return <p className="text-muted-foreground text-xs">No audit entries for this bonus yet.</p>;
  }

  return (
    <ul className="text-muted-foreground max-h-28 space-y-1 overflow-y-auto text-xs">
      {items.map((entry) => (
        <li key={entry.id}>
          <span className="text-foreground font-medium">{formatAuditAction(entry.action)}</span>
          {' · '}
          {actorLabel(entry)} · {new Date(entry.createdAt).toLocaleString()}
        </li>
      ))}
    </ul>
  );
}
