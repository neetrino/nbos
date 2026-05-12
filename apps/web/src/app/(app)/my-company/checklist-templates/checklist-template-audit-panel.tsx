'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { auditApi, type AuditLogEntry } from '@/lib/api/audit';

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
};

export function ChecklistTemplateAuditPanel({ templateId }: Props) {
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditApi.findByEntity(CHECKLIST_TEMPLATE_ENTITY_TYPE, templateId, {
        pageSize: 30,
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

  return (
    <div className="border-border bg-card rounded-2xl border p-4">
      <p className="text-muted-foreground mb-3 text-sm font-medium">Audit trail</p>
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
        <ul className="divide-border max-h-72 divide-y overflow-y-auto text-sm">
          {rows.map((row) => (
            <li key={row.id} className="py-2 pr-1">
              <p className="font-medium">{formatAction(row.action)}</p>
              <p className="text-muted-foreground text-xs">
                {new Date(row.createdAt).toLocaleString()} · {formatActor(row)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
