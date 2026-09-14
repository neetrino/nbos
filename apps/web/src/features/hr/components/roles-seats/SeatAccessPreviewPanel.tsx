'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { orgSeatsApi, type SeatAccessPreview, type SeatAccessGrant } from '@/lib/api/org-seats';

export function SeatAccessPreviewPanel({
  seatId,
  employeeId,
  operation,
  onSettled,
}: {
  seatId: string;
  employeeId: string;
  operation: 'ASSIGN' | 'END';
  /** Reports that the preview finished, whether it succeeded or failed. */
  onSettled: (settled: boolean) => void;
}) {
  const t = useTranslations('hr.rolesSeats');
  const key = `${seatId}:${employeeId}:${operation}`;
  const [state, setState] = useState<{ key: string; data: SeatAccessPreview | null }>({
    key: '',
    data: null,
  });
  useEffect(() => {
    let cancelled = false;
    onSettled(false);
    void orgSeatsApi
      .preview(seatId, employeeId, operation)
      .then((data) => {
        if (cancelled) return;
        setState({ key, data });
      })
      .catch(() => {
        if (!cancelled) setState({ key, data: null });
      })
      .finally(() => {
        // The server re-validates the operation, so a failed preview only loses the diff.
        if (!cancelled) onSettled(true);
      });
    return () => {
      cancelled = true;
    };
  }, [seatId, employeeId, operation, key, onSettled]);
  if (state.key !== key) return <p className="text-sm">{t('loading')}</p>;
  if (!state.data) {
    return (
      <p className="text-destructive text-sm">
        {t('access.loadFailed')} {t('access.previewFailedHint')}
      </p>
    );
  }
  return (
    <div className="max-h-48 space-y-2 overflow-auto rounded border p-3 text-xs">
      <p>{t('access.previewDescription')}</p>
      {state.data.changes.length === 0 ? (
        <p>{t('access.noChanges')}</p>
      ) : (
        state.data.changes.map((change) => (
          <p key={change.permission}>
            <strong>{change.permission}</strong>: {describe(change.before)} →{' '}
            {describe(change.after)}
          </p>
        ))
      )}
    </div>
  );
}

function describe(grant: SeatAccessGrant | null): string {
  if (!grant) return 'NONE';
  if (grant.all) return 'ALL';
  return [
    grant.own ? 'OWN' : '',
    grant.department ? `DEPARTMENT (${grant.departmentIds.length})` : '',
  ]
    .filter(Boolean)
    .join(' + ');
}
