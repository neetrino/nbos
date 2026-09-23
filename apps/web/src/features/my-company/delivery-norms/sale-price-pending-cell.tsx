'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_CURRENCY } from '@nbos/shared';
import { EntityListAmount, MoneyInput } from '@/components/shared';
import { Button } from '@/components/ui/button';

/** Stays the same width with the field closed or open. */
export const SALE_PRICE_PENDING_COLUMN_CLASS = 'w-72 max-w-72 overflow-hidden';

const PENDING_ROW_CLASS = 'flex w-full min-w-0 items-center gap-2';
const PENDING_INPUT_CLASS = 'h-8 min-w-0 flex-1';
const PENDING_BUTTON_CLASS = 'shrink-0';

export function SalePricePendingCell({
  open,
  canEdit,
  pendingAmount,
  nextAmount,
  saving,
  publish,
  onNextAmountChange,
  onSave,
  onToggleEdit,
}: {
  open: boolean;
  canEdit: boolean;
  pendingAmount: string | null;
  nextAmount: string;
  saving: boolean;
  publish: ReactNode;
  onNextAmountChange: (value: string) => void;
  onSave: () => void;
  onToggleEdit: () => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (open) {
    return (
      <PendingEditor
        nextAmount={nextAmount}
        saving={saving}
        label={t('salePrices.pending')}
        saveLabel={saving ? t('create.creating') : t('edit.save')}
        editLabel={t('edit.action')}
        onNextAmountChange={onNextAmountChange}
        onSave={onSave}
        onToggleEdit={onToggleEdit}
      />
    );
  }
  return (
    <ClosedPending
      pendingAmount={pendingAmount}
      empty={t('none')}
      editLabel={t('edit.action')}
      canEdit={canEdit}
      publish={publish}
      onToggleEdit={onToggleEdit}
    />
  );
}

function ClosedPending({
  pendingAmount,
  empty,
  editLabel,
  canEdit,
  publish,
  onToggleEdit,
}: {
  pendingAmount: string | null;
  empty: string;
  editLabel: string;
  canEdit: boolean;
  publish: ReactNode;
  onToggleEdit: () => void;
}) {
  return (
    <div className={PENDING_ROW_CLASS}>
      <PendingAmount amount={pendingAmount} empty={empty} />
      {canEdit ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={PENDING_BUTTON_CLASS}
          onClick={onToggleEdit}
        >
          {editLabel}
        </Button>
      ) : null}
      {publish}
    </div>
  );
}

function PendingEditor({
  nextAmount,
  saving,
  label,
  saveLabel,
  editLabel,
  onNextAmountChange,
  onSave,
  onToggleEdit,
}: {
  nextAmount: string;
  saving: boolean;
  label: string;
  saveLabel: string;
  editLabel: string;
  onNextAmountChange: (value: string) => void;
  onSave: () => void;
  onToggleEdit: () => void;
}) {
  return (
    <div className={PENDING_ROW_CLASS}>
      <MoneyInput
        className={PENDING_INPUT_CLASS}
        aria-label={label}
        value={nextAmount}
        disabled={saving}
        onChange={onNextAmountChange}
      />
      <Button
        type="button"
        size="sm"
        className={PENDING_BUTTON_CLASS}
        disabled={saving || nextAmount.trim() === ''}
        onClick={onSave}
      >
        {saveLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={PENDING_BUTTON_CLASS}
        onClick={onToggleEdit}
      >
        {editLabel}
      </Button>
    </div>
  );
}

function PendingAmount({ amount, empty }: { amount: string | null; empty: string }) {
  if (!amount) return <span className="text-muted-foreground">{empty}</span>;
  return <EntityListAmount amount={amount} currency={DELIVERY_COMPENSATION_CURRENCY} />;
}
