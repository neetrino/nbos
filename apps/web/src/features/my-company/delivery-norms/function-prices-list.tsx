'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type {
  DeliveryFunctionOperationalDto,
  DeliveryFunctionPriceFinancialDto,
} from '@nbos/shared';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { DeliveryNormsRecordRow } from './delivery-norms-record-row';
import {
  GROUP_HEADING_CLASS,
  NORMS_LIST_GRID_CLASS,
  PROFILE_VERSION_PREFIX,
} from './delivery-norms.constants';
import { groupPricedFunctions } from './group-catalog-functions';
import { NormativeStatusBadge, normativeStatusLabelKey } from './normative-status-badge';
import { PublishDraftButton } from './publish-draft-button';
import { summarizeRoleUnits } from './summarize-role-units';

export function FunctionPricesList({
  rows,
  catalog,
  canPublish,
  onPublished,
  onError,
}: {
  rows: DeliveryFunctionPriceFinancialDto[];
  catalog: DeliveryFunctionOperationalDto[];
  canPublish: boolean;
  onPublished: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const groups = useMemo(
    () => groupPricedFunctions(rows, catalog, t('prices.unknownFunction')),
    [catalog, rows, t],
  );
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('prices.empty')}</p>;
  }
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.category} className="space-y-3">
          <h4 className={GROUP_HEADING_CLASS}>{group.category}</h4>
          <div className={NORMS_LIST_GRID_CLASS}>
            {group.functions.map((cluster) => (
              <ul key={cluster.functionId} className="space-y-3">
                {cluster.rows.map((row) => (
                  <FunctionPriceRow
                    key={row.id}
                    title={cluster.title}
                    row={row}
                    canPublish={canPublish}
                    onPublished={onPublished}
                    onError={onError}
                  />
                ))}
              </ul>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function FunctionPriceRow({
  title,
  row,
  canPublish,
  onPublished,
  onError,
}: {
  title: string;
  row: DeliveryFunctionPriceFinancialDto;
  canPublish: boolean;
  onPublished: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <DeliveryNormsRecordRow>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-foreground text-sm font-semibold">{title}</p>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-xs">
            {PROFILE_VERSION_PREFIX}
            {row.version}
          </p>
          <NormativeStatusBadge
            status={row.status}
            label={t(normativeStatusLabelKey(row.status))}
          />
          {row.status === 'DRAFT' && canPublish ? (
            <PublishDraftButton
              roleUnits={row.roleUnits}
              onPublish={async (confirmZeroUnits) => {
                await deliveryNormsApi.publishFunctionPrice(row.id, { confirmZeroUnits });
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
  );
}
