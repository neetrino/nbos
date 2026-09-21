'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryRoleRateFinancialDto } from '@nbos/shared';
import {
  EntityListAmount,
  ENTITY_LIST_CELL_CLASS,
  ENTITY_LIST_HEAD_CLASS,
  ENTITY_LIST_ROW_HOVER_CLASS,
  ENTITY_LIST_SHELL_CLASS,
} from '@/components/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROLE_MESSAGE_KEYS } from './delivery-norms.constants';
import { NormativeStatusBadge, normativeStatusLabelKey } from './normative-status-badge';
import { PublishDraftButton } from './publish-draft-button';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';

export function RoleRatesTable({
  rows,
  canPublish,
  onPublished,
  onError,
}: {
  rows: DeliveryRoleRateFinancialDto[];
  canPublish: boolean;
  onPublished: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('rates.empty')}</p>;
  }
  return (
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.role')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.rate')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.version')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.status')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <RoleRateRow
              key={row.id}
              row={row}
              canPublish={canPublish}
              onPublished={onPublished}
              onError={onError}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RoleRateRow({
  row,
  canPublish,
  onPublished,
  onError,
}: {
  row: DeliveryRoleRateFinancialDto;
  canPublish: boolean;
  onPublished: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <TableRow className={ENTITY_LIST_ROW_HOVER_CLASS}>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <span className="text-foreground text-sm font-medium">
          {t(ROLE_MESSAGE_KEYS[row.roleKey])}
        </span>
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <EntityListAmount amount={row.rate} currency={row.currency} />
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <span className="text-muted-foreground tabular-nums">{row.version}</span>
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <NormativeStatusBadge status={row.status} label={t(normativeStatusLabelKey(row.status))} />
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {row.status === 'DRAFT' && canPublish ? (
          <PublishDraftButton
            onPublish={async () => {
              await deliveryNormsApi.publishRoleRate(row.id);
            }}
            onError={onError}
            onPublished={onPublished}
          />
        ) : null}
      </TableCell>
    </TableRow>
  );
}
