'use client';

import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_CURRENCY } from '@nbos/shared';
import { EntityListAmount } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PENDING_INPUT_CLASS = 'h-8 w-32';

export function SalePricePendingCell({
  open,
  pendingAmount,
  nextAmount,
  saving,
  onNextAmountChange,
  onSave,
}: {
  open: boolean;
  pendingAmount: string | null;
  nextAmount: string;
  saving: boolean;
  onNextAmountChange: (value: string) => void;
  onSave: () => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (!open) return <PendingAmount amount={pendingAmount} empty={t('none')} />;
  return (
    <div className="flex items-center gap-2">
      <Input
        className={PENDING_INPUT_CLASS}
        inputMode="decimal"
        aria-label={t('salePrices.pending')}
        value={nextAmount}
        disabled={saving}
        onChange={(event) => onNextAmountChange(event.target.value)}
      />
      <Button
        type="button"
        size="sm"
        disabled={saving || nextAmount.trim() === ''}
        onClick={onSave}
      >
        {saving ? t('create.creating') : t('edit.save')}
      </Button>
    </div>
  );
}

function PendingAmount({ amount, empty }: { amount: string | null; empty: string }) {
  if (!amount) return <span className="text-muted-foreground">{empty}</span>;
  return <EntityListAmount amount={amount} currency={DELIVERY_COMPENSATION_CURRENCY} />;
}
