'use client';

import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_CURRENCY } from '@nbos/shared';
import { AmdCurrencyIcon, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { Button } from '@/components/ui/button';
import {
  NORMS_INLINE_MONEY_ROW_CLASS,
  NORMS_SHEET_FIELD_PAIR_CLASS,
} from './delivery-norms.constants';

export function NormsInlineMoneyEdit({
  currentAmount,
  nextAmount,
  saving,
  onNextAmountChange,
  onSave,
}: {
  currentAmount: string | null;
  nextAmount: string;
  saving: boolean;
  onNextAmountChange: (value: string) => void;
  onSave: () => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <div className={NORMS_INLINE_MONEY_ROW_CLASS}>
      <div className={NORMS_SHEET_FIELD_PAIR_CLASS}>
        <InlineField
          editable={false}
          className={FORM_FIELD_CELL_CLASS}
          label={t('rates.current')}
          value={currentAmount ?? t('none')}
          type={currentAmount ? 'money' : 'text'}
          icon={<AmdCurrencyIcon className="text-muted-foreground/70" />}
        />
        <InlineField
          variant="controlled"
          className={FORM_FIELD_CELL_CLASS}
          type="money"
          label={`${t('rates.next')} · ${DELIVERY_COMPENSATION_CURRENCY}`}
          value={nextAmount}
          disabled={saving}
          icon={<AmdCurrencyIcon className="text-muted-foreground/70" />}
          onValueChange={onNextAmountChange}
        />
      </div>
      <Button
        type="button"
        size="sm"
        className="shrink-0"
        disabled={saving || nextAmount.trim() === ''}
        onClick={onSave}
      >
        {saving ? t('create.creating') : t('edit.save')}
      </Button>
    </div>
  );
}
