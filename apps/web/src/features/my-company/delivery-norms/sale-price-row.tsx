'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_CURRENCY } from '@nbos/shared';
import {
  EntityListAmount,
  ENTITY_LIST_CELL_CLASS,
  ENTITY_LIST_ROW_HOVER_CLASS,
} from '@/components/shared';
import { TableCell, TableRow } from '@/components/ui/table';
import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { parseMoneyAmount } from '@/lib/format/money';
import { dateInputToIso, todayDateInputValue } from './effective-from';
import { liveNormDisplayStatus } from './live-norm-pair';
import type { LiveSalePrice } from './live-sale-prices';
import { messageFromCaught } from './message-from-caught';
import { SALE_PRICE_PENDING_COLUMN_CLASS, SalePricePendingCell } from './sale-price-pending-cell';
import { NormativeStatusBadge, normativeStatusLabelKey } from './normative-status-badge';
import { parseSalePriceTargetKey, salePriceDraftBody } from './sale-price-draft';
import { PublishDraftButton } from './publish-draft-button';

export function SalePriceLiveRow({
  pair,
  title,
  unitsLabel,
  canPublish,
  onChanged,
  onError,
}: {
  pair: LiveSalePrice;
  title: string;
  unitsLabel: string;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const edit = useSalePriceEdit(pair);
  return (
    <SalePriceSummaryRow
      pair={pair}
      title={title}
      unitsLabel={unitsLabel}
      canPublish={canPublish}
      editing={edit.open}
      nextAmount={edit.nextAmount}
      pendingAmount={edit.shownPending}
      saving={edit.saving}
      onNextAmountChange={edit.setNextAmount}
      onToggleEdit={() => {
        edit.setNextAmount(plainSaleAmount(edit.shownPending));
        edit.setOpen((current) => !current);
      }}
      onSave={() => startSalePriceSave(edit, pair, t('errors.salePrices'), onChanged, onError)}
      onChanged={onChanged}
      onError={onError}
    />
  );
}

type SalePriceSummaryRowProps = {
  pair: LiveSalePrice;
  title: string;
  unitsLabel: string;
  canPublish: boolean;
  editing: boolean;
  nextAmount: string;
  pendingAmount: string | null;
  saving: boolean;
  onNextAmountChange: (value: string) => void;
  onToggleEdit: () => void;
  onSave: () => void;
  onChanged: () => void;
  onError: (message: string) => void;
};

function SalePriceSummaryRow(props: SalePriceSummaryRowProps) {
  const { pair, title, unitsLabel, canPublish, editing, nextAmount, pendingAmount, saving } = props;
  const t = useTranslations('hr.deliveryNorms');
  const version = pair.draft?.version ?? pair.published?.version ?? '—';
  return (
    <TableRow className={ENTITY_LIST_ROW_HOVER_CLASS}>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <span className="text-foreground text-sm font-medium">{title}</span>
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <span className="text-muted-foreground tabular-nums">{unitsLabel}</span>
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <SalePriceAmount amount={pair.published?.amountPerUnit ?? null} empty={t('none')} />
      </TableCell>
      <TableCell className={`${ENTITY_LIST_CELL_CLASS} ${SALE_PRICE_PENDING_COLUMN_CLASS}`}>
        <SalePricePendingCell
          open={editing}
          canEdit={canPublish}
          pendingAmount={pendingAmount}
          nextAmount={nextAmount}
          saving={saving}
          publish={salePricePublish(pair, canPublish, props.onChanged, props.onError)}
          onNextAmountChange={props.onNextAmountChange}
          onSave={props.onSave}
          onToggleEdit={props.onToggleEdit}
        />
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <span className="text-muted-foreground tabular-nums">{version}</span>
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <SalePriceStatus pair={pair} />
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

function salePricePublish(
  pair: LiveSalePrice,
  canPublish: boolean,
  onChanged: () => void,
  onError: (message: string) => void,
) {
  if (!pair.draft || !canPublish) return null;
  return (
    <PublishDraftButton
      onPublish={async () => {
        await deliveryCatalogStructureApi.publishSalePrice(pair.draft?.id ?? '');
      }}
      onError={onError}
      onPublished={onChanged}
    />
  );
}

function useSalePriceEdit(pair: LiveSalePrice) {
  const [open, setOpen] = useState(false);
  const [nextAmount, setNextAmount] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const serverPending = pair.draft?.amountPerUnit ?? null;
  useEffect(() => {
    if (preview && serverPending && plainSaleAmount(preview) === plainSaleAmount(serverPending)) {
      setPreview(null);
    }
  }, [preview, serverPending]);
  return {
    open,
    setOpen,
    nextAmount,
    setNextAmount,
    setPreview,
    saving,
    setSaving,
    shownPending: preview ?? serverPending,
  };
}

function plainSaleAmount(amount: string | null | undefined): string {
  if (!amount) return '';
  const value = parseMoneyAmount(amount);
  if (!Number.isFinite(value) || value <= 0) return '';
  return String(Math.trunc(value));
}

function startSalePriceSave(
  edit: ReturnType<typeof useSalePriceEdit>,
  pair: LiveSalePrice,
  fallback: string,
  onChanged: () => void,
  onError: (message: string) => void,
): void {
  const amount = edit.nextAmount.trim();
  if (amount === '') return;
  edit.setPreview(amount);
  edit.setOpen(false);
  void saveSalePriceDraft({
    pair,
    nextAmount: amount,
    fallback,
    onChanged,
    onError: (message) => {
      edit.setPreview(null);
      edit.setOpen(true);
      onError(message);
    },
    setSaving: edit.setSaving,
  });
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
