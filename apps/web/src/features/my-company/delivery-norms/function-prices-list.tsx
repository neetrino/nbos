'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type {
  DeliveryFunctionOperationalDto,
  DeliveryFunctionPriceFinancialDto,
} from '@nbos/shared';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
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
  const titles = useMemo(() => functionTitleMap(catalog), [catalog]);
  const groups = useMemo(() => groupPrices(rows), [rows]);
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('prices.empty')}</p>;
  }
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.functionId} className="space-y-2">
          <h4 className="text-foreground text-sm font-semibold">
            {titles.get(group.functionId) ?? t('prices.unknownFunction')}
          </h4>
          <ul className="space-y-2">
            {group.rows.map((row) => (
              <FunctionPriceRow
                key={row.id}
                row={row}
                canPublish={canPublish}
                onPublished={onPublished}
                onError={onError}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function FunctionPriceRow({
  row,
  canPublish,
  onPublished,
  onError,
}: {
  row: DeliveryFunctionPriceFinancialDto;
  canPublish: boolean;
  onPublished: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <li className="border-border space-y-2 rounded-xl border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          {t('columns.version')} {row.version}
        </p>
        <div className="flex items-center gap-2">
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
      <p className="text-muted-foreground text-xs">{summarizeRoleUnits(row.roleUnits)}</p>
    </li>
  );
}

function functionTitleMap(catalog: DeliveryFunctionOperationalDto[]): Map<string, string> {
  return new Map(catalog.map((item) => [item.id, item.title]));
}

function groupPrices(rows: DeliveryFunctionPriceFinancialDto[]): Array<{
  functionId: string;
  rows: DeliveryFunctionPriceFinancialDto[];
}> {
  const order: string[] = [];
  const grouped = new Map<string, DeliveryFunctionPriceFinancialDto[]>();
  for (const row of rows) {
    const list = grouped.get(row.functionId);
    if (!list) {
      grouped.set(row.functionId, [row]);
      order.push(row.functionId);
      continue;
    }
    list.push(row);
  }
  return order.map((functionId) => ({
    functionId,
    rows: [...(grouped.get(functionId) ?? [])].sort((a, b) => b.version - a.version),
  }));
}
