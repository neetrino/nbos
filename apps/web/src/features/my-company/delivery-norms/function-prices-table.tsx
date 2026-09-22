'use client';

import { useTranslations } from 'next-intl';
import {
  ENTITY_LIST_CELL_CLASS,
  ENTITY_LIST_HEAD_CLASS,
  ENTITY_LIST_ROW_HOVER_CLASS,
  ENTITY_LIST_SHELL_CLASS,
} from '@/components/shared';
import { NormsRowActions } from './norms-row-actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { liveNormDisplayStatus } from './live-norm-pair';
import type { LiveFunctionPrice } from './live-function-prices';
import { NormativeStatusBadge, normativeStatusLabelKey } from './normative-status-badge';
import { PublishDraftButton } from './publish-draft-button';
import { summarizeRoleUnits } from './summarize-role-units';

export function FunctionPricesTable({
  pairs,
  titles,
  canAdd,
  canPublish,
  onEdit,
  onChanged,
  onError,
}: {
  pairs: LiveFunctionPrice[];
  titles: Map<string, string>;
  canAdd: boolean;
  canPublish: boolean;
  onEdit: (pair: LiveFunctionPrice) => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (pairs.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('prices.empty')}</p>;
  }
  return (
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('fields.function')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.version')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.status')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pairs.map((pair) => (
            <FunctionPriceSummaryRow
              key={pair.key}
              pair={pair}
              title={titles.get(pair.key) ?? t('prices.unknownFunction')}
              canEdit={pair.draft ? canPublish : canAdd}
              canPublish={canPublish}
              onEdit={() => onEdit(pair)}
              onChanged={onChanged}
              onError={onError}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function FunctionPriceSummaryRow({
  pair,
  title,
  canEdit,
  canPublish,
  onEdit,
  onChanged,
  onError,
}: {
  pair: LiveFunctionPrice;
  title: string;
  canEdit: boolean;
  canPublish: boolean;
  onEdit: () => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const current = pair.draft ?? pair.published;
  const status = liveNormDisplayStatus(pair);
  return (
    <TableRow className={ENTITY_LIST_ROW_HOVER_CLASS}>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <div className="space-y-1">
          <p className="text-foreground text-sm font-medium">{title}</p>
          {current ? (
            <p className="text-muted-foreground text-xs">{summarizeRoleUnits(current.roleUnits)}</p>
          ) : null}
        </div>
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <span className="text-muted-foreground tabular-nums">{current?.version ?? '—'}</span>
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {current ? (
          <NormativeStatusBadge status={status} label={t(normativeStatusLabelKey(status))} />
        ) : (
          <span className="text-muted-foreground">{t('none')}</span>
        )}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <NormsRowActions
          canEdit={canEdit}
          editLabel={t('edit.action')}
          onToggleEdit={onEdit}
          publish={
            pair.draft && canPublish ? (
              <PublishDraftButton
                roleUnits={pair.draft.roleUnits}
                onPublish={async (confirmZeroUnits) => {
                  await deliveryNormsApi.publishFunctionPrice(pair.draft?.id ?? '', {
                    confirmZeroUnits,
                  });
                }}
                onError={onError}
                onPublished={onChanged}
              />
            ) : null
          }
        />
      </TableCell>
    </TableRow>
  );
}
