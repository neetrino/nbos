'use client';

import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_CURRENCY, type DeliveryCompensationRoleKey } from '@nbos/shared';
import { AmdCurrencyIcon, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { NORMS_SHEET_FIELD_PAIR_CLASS, ROLE_MESSAGE_KEYS } from './delivery-norms.constants';
import { ROLE_UNIT_EMPTY_DISPLAY } from './summarize-role-units';

export function RoleRateDraftFields({
  roleKey,
  currentRate,
  value,
  disabled,
  onValueChange,
}: {
  roleKey: DeliveryCompensationRoleKey;
  currentRate: string | null;
  value: string;
  disabled: boolean;
  onValueChange: (value: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <div className="space-y-2">
      <p className="text-foreground text-sm font-medium">{t(ROLE_MESSAGE_KEYS[roleKey])}</p>
      <div className={NORMS_SHEET_FIELD_PAIR_CLASS}>
        <InlineField
          editable={false}
          className={FORM_FIELD_CELL_CLASS}
          label={t('rates.current')}
          value={currentRate ?? ROLE_UNIT_EMPTY_DISPLAY}
          type={currentRate ? 'money' : 'text'}
          icon={<AmdCurrencyIcon className="text-muted-foreground/70" />}
        />
        <InlineField
          variant="controlled"
          className={FORM_FIELD_CELL_CLASS}
          label={`${t('rates.next')} · ${DELIVERY_COMPENSATION_CURRENCY}`}
          value={value}
          disabled={disabled}
          icon={<AmdCurrencyIcon className="text-muted-foreground/70" />}
          onValueChange={onValueChange}
        />
      </div>
    </div>
  );
}
