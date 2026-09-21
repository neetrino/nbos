'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryRoleRateFinancialDto } from '@nbos/shared';
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('columns.role')}</TableHead>
          <TableHead>{t('columns.rate')}</TableHead>
          <TableHead>{t('columns.currency')}</TableHead>
          <TableHead>{t('columns.version')}</TableHead>
          <TableHead>{t('columns.status')}</TableHead>
          <TableHead>{t('columns.actions')}</TableHead>
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
    <TableRow>
      <TableCell>{t(ROLE_MESSAGE_KEYS[row.roleKey])}</TableCell>
      <TableCell>{row.rate}</TableCell>
      <TableCell>{row.currency}</TableCell>
      <TableCell>{row.version}</TableCell>
      <TableCell>
        <NormativeStatusBadge status={row.status} label={t(normativeStatusLabelKey(row.status))} />
      </TableCell>
      <TableCell>
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
