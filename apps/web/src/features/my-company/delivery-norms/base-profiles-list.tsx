'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryBaseProfileFinancialDto } from '@nbos/shared';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { DeliveryNormsRecordRow } from './delivery-norms-record-row';
import { NormativeStatusBadge, normativeStatusLabelKey } from './normative-status-badge';
import { PublishDraftButton } from './publish-draft-button';
import { summarizeRoleUnits } from './summarize-role-units';

export function BaseProfilesList({
  rows,
  canPublish,
  onPublished,
  onError,
}: {
  rows: DeliveryBaseProfileFinancialDto[];
  canPublish: boolean;
  onPublished: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('profiles.empty')}</p>;
  }
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <DeliveryNormsRecordRow key={row.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-foreground text-sm font-semibold">{row.profileKey}</p>
              <p className="text-muted-foreground text-xs">
                {t('columns.version')} {row.version} ·{' '}
                {t('profiles.includedCount', { count: row.includedFunctionIds.length })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <NormativeStatusBadge
                status={row.status}
                label={t(normativeStatusLabelKey(row.status))}
              />
              {row.status === 'DRAFT' && canPublish ? (
                <PublishDraftButton
                  roleUnits={row.roleUnits}
                  onPublish={async (confirmZeroUnits) => {
                    await deliveryNormsApi.publishBaseProfile(row.id, { confirmZeroUnits });
                  }}
                  onError={onError}
                  onPublished={onPublished}
                />
              ) : null}
            </div>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {summarizeRoleUnits(row.roleUnits)}
          </p>
        </DeliveryNormsRecordRow>
      ))}
    </ul>
  );
}
