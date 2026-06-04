'use client';

import {
  DETAIL_SHEET_SECTION_STRETCH_CLASS,
  DETAIL_SHEET_TAB_LIST_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { labelCredentialAuditAction } from '@/features/credentials/utils/credential-audit-label';
import type { AuditLogEntry } from '@/lib/api/audit';

function actorLabel(entry: AuditLogEntry): string {
  if (!entry.actor) return 'System';
  return `${entry.actor.firstName} ${entry.actor.lastName}`.trim();
}

export interface CredentialSheetAuditPanelProps {
  entries: AuditLogEntry[];
  loading: boolean;
  onReload: () => void;
  /** Inside {@link DetailSheetTabBar} — hide duplicate section chrome. */
  embedded?: boolean;
}

export function CredentialSheetAuditPanel({
  entries,
  loading,
  onReload,
  embedded = false,
}: CredentialSheetAuditPanelProps) {
  return (
    <section
      className={
        embedded
          ? cn(DETAIL_SHEET_SECTION_STRETCH_CLASS, 'gap-3 pt-3')
          : 'border-border grid gap-3 border-t pt-5'
      }
      aria-label="Audit log"
    >
      <div className="flex items-center justify-between gap-2">
        {embedded ? (
          <span className="sr-only">Activity</span>
        ) : (
          <h3 className="text-sm font-medium">Activity</h3>
        )}
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onReload}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <Skeleton className={cn('w-full rounded-lg', embedded ? 'min-h-32 flex-1' : 'h-24')} />
      ) : entries.length === 0 ? (
        <p className="text-muted-foreground text-xs">No activity recorded yet.</p>
      ) : (
        <ul
          className={cn(
            'text-muted-foreground space-y-2 text-xs',
            embedded ? DETAIL_SHEET_TAB_LIST_CLASS : 'max-h-44 overflow-y-auto',
          )}
        >
          {entries.map((entry) => (
            <li key={entry.id}>
              <span className="text-foreground font-medium">
                {labelCredentialAuditAction(entry.action)}
              </span>
              {' · '}
              {actorLabel(entry)} · {new Date(entry.createdAt).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
