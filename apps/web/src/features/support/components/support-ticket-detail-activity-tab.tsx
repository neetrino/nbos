'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { AuditLogEntry } from '@/lib/api/audit';
import {
  formatSupportAuditLine,
  type SupportTranslator,
} from '@/features/support/support-message-keys';
import { formatSupportAuditTimestamp } from './support-ticket-detail-helpers';

export interface SupportTicketDetailActivityTabProps {
  loading: boolean;
  items: AuditLogEntry[];
}

export function SupportTicketDetailActivityTab({
  loading,
  items,
}: SupportTicketDetailActivityTabProps) {
  const t = useTranslations('support') as SupportTranslator;
  const locale = useLocale();

  if (loading) {
    return (
      <div className="px-5 py-4 sm:px-7">
        <p className="text-muted-foreground text-sm">{t('sheet.activityLoading')}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-5 py-4 sm:px-7">
        <p className="text-muted-foreground text-sm">{t('sheet.noAudit')}</p>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 sm:px-7">
      <ul className="space-y-3">
        {items.map((entry) => (
          <li key={entry.id} className="text-sm">
            <p className="text-muted-foreground text-xs">
              {formatSupportAuditTimestamp(entry.createdAt, locale)}
              {entry.actor ? ` · ${entry.actor.firstName} ${entry.actor.lastName}` : ''}
            </p>
            <p className="font-medium">{formatSupportAuditLine(entry, t)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
