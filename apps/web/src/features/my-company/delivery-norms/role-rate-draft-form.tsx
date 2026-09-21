'use client';

import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_ROLE_KEYS, type DeliveryCompensationRoleKey } from '@nbos/shared';
import { InlineField } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { DETAIL_SHEET_PANEL_DIVIDER_CLASS } from '@/components/shared/detail-sheet-classes';
import { NormsSheetSection } from './norms-sheet-section';
import { RoleRateDraftFields } from './role-rate-draft-fields';
import { fillRoleRatesAtSeed, type RoleRateDraftMap } from './role-units-draft';

type RoleRateDraftFormProps = {
  rates: RoleRateDraftMap;
  currentByRole: Record<DeliveryCompensationRoleKey, string | null>;
  effectiveFrom: string;
  saving: boolean;
  onRatesChange: (rates: RoleRateDraftMap) => void;
  onEffectiveFromChange: (value: string) => void;
};

export function RoleRateDraftForm({
  rates,
  currentByRole,
  effectiveFrom,
  saving,
  onRatesChange,
  onEffectiveFromChange,
}: RoleRateDraftFormProps) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <NormsSheetSection title={t('rates.title')}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-end"
        disabled={saving}
        onClick={() => onRatesChange(fillRoleRatesAtSeed(rates))}
      >
        {t('rates.fillSeed')}
      </Button>
      {DELIVERY_COMPENSATION_ROLE_KEYS.map((roleKey) => (
        <RoleRateDraftFields
          key={roleKey}
          roleKey={roleKey}
          currentRate={currentByRole[roleKey]}
          value={rates[roleKey]}
          disabled={saving}
          onValueChange={(value) => onRatesChange({ ...rates, [roleKey]: value })}
        />
      ))}
      <div className={DETAIL_SHEET_PANEL_DIVIDER_CLASS}>
        <InlineField
          variant="controlled"
          type="date"
          className={FORM_FIELD_CELL_CLASS}
          label={t('fields.effectiveFrom')}
          value={effectiveFrom}
          disabled={saving}
          onValueChange={onEffectiveFromChange}
        />
      </div>
    </NormsSheetSection>
  );
}
