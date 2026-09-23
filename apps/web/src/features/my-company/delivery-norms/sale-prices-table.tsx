'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_CURRENCY } from '@nbos/shared';
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
import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { dateInputToIso, todayDateInputValue } from './effective-from';
import { liveNormDisplayStatus } from './live-norm-pair';
import type { LiveSalePrice } from './live-sale-prices';
import { messageFromCaught } from './message-from-caught';
import { NormsRowActions } from './norms-row-actions';
import { SalePricePendingCell } from './sale-price-pending-cell';
import { NormativeStatusBadge, normativeStatusLabelKey } from './normative-status-badge';
import { parseSalePriceTargetKey, salePriceDraftBody } from './sale-price-draft';
import { PublishDraftButton } from './publish-draft-button';

export function SalePricesTable({
  pairs,
  labels,
  canPublish,
  onChanged,
  onError,
}: {
  pairs: LiveSalePrice[];
  labels: Map<string, string>;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (pairs.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('salePrices.empty')}</p>;
  }
  return (
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('salePrices.pickTarget')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>
              {t('salePrices.amountPerUnitShort')}
            </TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('salePrices.pending')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.version')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.status')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pairs.map((pair) => (
            <SalePriceLiveRow
              key={pair.targetKey}
              pair={pair}
              title={labels.get(pair.targetKey) ?? t('salePrices.unknownTarget')}
              canPublish={canPublish}
              onChanged={onChanged}
              onError={onError}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SalePriceLiveRow({
  pair,
  title,
  canPublish,
  onChanged,
  onError,
}: {
  pair: LiveSalePrice;
  title: string;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [open, setOpen] = useState(false);
  const [nextAmount, setNextAmount] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <SalePriceSummaryRow
      pair={pair}
      title={title}
      canPublish={canPublish}
      editing={open}
      nextAmount={nextAmount}
      saving={saving}
      onNextAmountChange={setNextAmount}
      onToggleEdit={() => {
        setNextAmount(pair.draft?.amountPerUnit ?? '');
        setOpen((current) => !current);
      }}
      onSave={() => {
        void saveSalePriceDraft({
          pair,
          nextAmount,
          fallback: t('errors.salePrices'),
          onError,
          onChanged: () => {
            setOpen(false);
            onChanged();
          },
          setSaving,
        });
      }}
      onChanged={onChanged}
      onError={onError}
    />
  );
}

type SalePriceSummaryRowProps = {
  pair: LiveSalePrice;
  title: string;
  canPublish: boolean;
  editing: boolean;
  nextAmount: string;
  saving: boolean;
  onNextAmountChange: (value: string) => void;
  onToggleEdit: () => void;
  onSave: () => void;
  onChanged: () => void;
  onError: (message: string) => void;
};

function SalePriceSummaryRow(props: SalePriceSummaryRowProps) {
  const { pair, title, canPublish, editing, nextAmount, saving } = props;
  const t = useTranslations('hr.deliveryNorms');
  const version = pair.draft?.version ?? pair.published?.version ?? '—';
  return (
    <TableRow className={ENTITY_LIST_ROW_HOVER_CLASS}>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <span className="text-foreground text-sm font-medium">{title}</span>
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <SalePriceAmount amount={pair.published?.amountPerUnit ?? null} empty={t('none')} />
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <SalePricePendingCell
          open={editing}
          pendingAmount={pair.draft?.amountPerUnit ?? null}
          nextAmount={nextAmount}
          saving={saving}
          onNextAmountChange={props.onNextAmountChange}
          onSave={props.onSave}
        />
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <span className="text-muted-foreground tabular-nums">{version}</span>
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <SalePriceStatus pair={pair} />
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <SalePriceActions
          pair={pair}
          canPublish={canPublish}
          onToggleEdit={props.onToggleEdit}
          onChanged={props.onChanged}
          onError={props.onError}
        />
      </TableCell>
    </TableRow>
  );
}

function SalePriceStatus({ pair }: { pair: LiveSalePrice }) {
  const t = useTranslations('hr.deliveryNorms');
  if (!pair.published && !pair.draft) {
    return <span className="text-muted-foreground">{t('none')}</span>;
  }
  const status = liveNormDisplayStatus(pair);
  return <NormativeStatusBadge status={status} label={t(normativeStatusLabelKey(status))} />;
}

function SalePriceAmount({ amount, empty }: { amount: string | null; empty: string }) {
  if (!amount) return <span className="text-muted-foreground">{empty}</span>;
  return <EntityListAmount amount={amount} currency={DELIVERY_COMPENSATION_CURRENCY} />;
}

function SalePriceActions({
  pair,
  canPublish,
  onToggleEdit,
  onChanged,
  onError,
}: {
  pair: LiveSalePrice;
  canPublish: boolean;
  onToggleEdit: () => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <NormsRowActions
      canEdit={canPublish}
      editLabel={t('edit.action')}
      onToggleEdit={onToggleEdit}
      publish={
        pair.draft && canPublish ? (
          <PublishDraftButton
            onPublish={async () => {
              await deliveryCatalogStructureApi.publishSalePrice(pair.draft?.id ?? '');
            }}
            onError={onError}
            onPublished={onChanged}
          />
        ) : null
      }
    />
  );
}

async function saveSalePriceDraft(input: {
  pair: LiveSalePrice;
  nextAmount: string;
  fallback: string;
  onError: (message: string) => void;
  onChanged: () => void;
  setSaving: (value: boolean) => void;
}): Promise<void> {
  input.setSaving(true);
  try {
    if (input.pair.draft) {
      await deliveryCatalogStructureApi.updateSalePriceDraft(input.pair.draft.id, {
        amountPerUnit: input.nextAmount.trim(),
      });
    } else {
      const parsed = parseSalePriceTargetKey(input.pair.targetKey);
      if (!parsed) {
        input.onError(input.fallback);
        return;
      }
      await deliveryCatalogStructureApi.createSalePriceDraft(
        salePriceDraftBody(parsed.kind, parsed.id, {
          amountPerUnit: input.nextAmount.trim(),
          effectiveFrom: dateInputToIso(todayDateInputValue()),
        }),
      );
    }
    input.onChanged();
  } catch (caught) {
    input.onError(messageFromCaught(caught, input.fallback));
  } finally {
    input.setSaving(false);
  }
}
