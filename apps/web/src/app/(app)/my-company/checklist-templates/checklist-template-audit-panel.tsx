'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { auditApi, type AuditLogEntry } from '@/lib/api/audit';
import { cn } from '@/lib/utils';

const CHECKLIST_TEMPLATE_ENTITY_TYPE = 'ChecklistTemplate';

const ACTION_LABELS: Record<string, string> = {
  'checklist_template.created': 'Template created',
  'checklist_template.metadata_updated': 'Details updated',
  'checklist_template.draft_updated': 'Draft items saved',
  'checklist_template.version_published': 'Version published',
  'checklist_template.archived': 'Archived',
  'checklist_template.duplicated': 'Duplicated from another template',
};

function formatAction(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function formatActor(entry: AuditLogEntry): string {
  if (entry.actor) {
    return `${entry.actor.firstName} ${entry.actor.lastName}`.trim();
  }
  return entry.userId.slice(0, 8);
}

type Props = {
  templateId: string;
  /** When true, omit outer card and use denser typography (parent provides layout). */
  embedded?: boolean;
};

export function ChecklistTemplateAuditPanel({ templateId, embedded = false }: Props) {
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditApi.findByEntity(CHECKLIST_TEMPLATE_ENTITY_TYPE, templateId, {
        pageSize: 24,
      });
      setRows(res.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load audit trail.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    void load();
  }, [load]);

  const inner = (
    <>
      {!embedded ? (
        <p className="text-muted-foreground mb-3 text-sm font-medium">Audit trail</p>
      ) : null}
      {loading ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading…
        </div>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {!loading && !error && rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No audit entries yet.</p>
      ) : null}
      {!loading && rows.length > 0 ? (
        <ul
          className={cn(
            'divide-border divide-y overflow-y-auto',
            embedded ? 'max-h-44 text-xs' : 'max-h-72 text-sm',
          )}
        >
          {rows.map((row) => (
            <li key={row.id} className={cn('py-2 pr-1', embedded && 'py-1.5')}>
              <p className={cn('font-medium', embedded && 'text-xs')}>{formatAction(row.action)}</p>
              <p className="text-muted-foreground text-[0.6875rem] leading-snug">
                {new Date(row.createdAt).toLocaleString()} · {formatActor(row)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className="min-w-0">{inner}</div>;
  }

  return <div className="border-border bg-card rounded-2xl border p-4">{inner}</div>;
}
