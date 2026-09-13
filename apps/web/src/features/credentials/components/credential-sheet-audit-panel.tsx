'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  DETAIL_SHEET_SECTION_STRETCH_CLASS,
  DETAIL_SHEET_TAB_LIST_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { labelCredentialAuditAction } from '@/features/credentials/utils/credential-audit-label';
import type { AuditLogEntry } from '@/lib/api/audit';

function actorLabel(entry: AuditLogEntry, systemLabel: string): string {
  if (!entry.actor) return systemLabel;
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
  const t = useTranslations('credentials');
  const locale = useLocale();

  return (
    <section
      className={
        embedded
          ? cn(DETAIL_SHEET_SECTION_STRETCH_CLASS, 'gap-3 pt-3')
          : 'border-border grid gap-3 border-t pt-5'
      }
      aria-label={t('audit.aria')}
    >
      <div className="flex items-center justify-between gap-2">
        {embedded ? (
          <span className="sr-only">{t('form.tabs.activity')}</span>
        ) : (
          <h3 className="text-sm font-medium">{t('form.tabs.activity')}</h3>
        )}
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onReload}>
          {t('audit.refresh')}
        </Button>
      </div>

      {loading ? (
        <Skeleton className={cn('w-full rounded-lg', embedded ? 'min-h-32 flex-1' : 'h-24')} />
      ) : entries.length === 0 ? (
        <p className="text-muted-foreground text-xs">{t('audit.empty')}</p>
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
                {labelCredentialAuditAction(entry.action, t)}
              </span>
              {' · '}
              {actorLabel(entry, t('audit.system'))} ·{' '}
              {new Date(entry.createdAt).toLocaleString(locale)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
