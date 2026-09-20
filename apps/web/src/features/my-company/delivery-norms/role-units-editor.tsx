'use client';

import { useTranslations } from 'next-intl';
import { isExplicitZeroUnits, type DeliveryRoleUnitKind } from '@nbos/shared';
import { Input } from '@/components/ui/input';
import { ROLE_MESSAGE_KEYS, ROLE_UNIT_ROW_CLASS } from './delivery-norms.constants';
import { NormEnumSelect } from './norm-enum-select';
import {
  emptyUnitsInputToNull,
  replaceRoleUnitDraft,
  type RoleUnitDraftRow,
} from './role-units-draft';

const UNIT_KIND_OPTIONS = ['REQUIRED', 'NOT_REQUIRED'] as const;

export function RoleUnitsEditor({
  rows,
  disabled,
  onChange,
}: {
  rows: RoleUnitDraftRow[];
  disabled?: boolean;
  onChange: (next: RoleUnitDraftRow[]) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-foreground text-sm font-semibold">{t('roleUnits.title')}</legend>
      <p className="text-muted-foreground text-xs">{t('roleUnits.hint')}</p>
      <div className="space-y-3">
        {rows.map((row) => (
          <RoleUnitRow
            key={row.roleKey}
            row={row}
            disabled={disabled}
            onChange={(patch) => onChange(replaceRoleUnitDraft(rows, row.roleKey, patch))}
          />
        ))}
      </div>
    </fieldset>
  );
}

function RoleUnitRow({
  row,
  disabled,
  onChange,
}: {
  row: RoleUnitDraftRow;
  disabled?: boolean;
  onChange: (patch: Partial<Omit<RoleUnitDraftRow, 'roleKey'>>) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const notRequired = row.unitKind === 'NOT_REQUIRED';
  return (
    <div className={ROLE_UNIT_ROW_CLASS}>
      <p className="text-foreground self-center text-sm font-medium">
        {t(ROLE_MESSAGE_KEYS[row.roleKey])}
      </p>
      <NormEnumSelect
        id={`role-unit-kind-${row.roleKey}`}
        value={row.unitKind}
        options={UNIT_KIND_OPTIONS}
        labels={{ REQUIRED: t('roleUnits.required'), NOT_REQUIRED: t('roleUnits.notRequired') }}
        disabled={disabled}
        onChange={(unitKind: DeliveryRoleUnitKind) => onChange({ unitKind })}
      />
      <div className="space-y-1">
        <Input
          value={row.unitsInput}
          disabled={disabled || notRequired}
          inputMode="decimal"
          placeholder={t('roleUnits.placeholder')}
          onChange={(event) => onChange({ unitsInput: event.target.value })}
        />
        <p className="text-muted-foreground text-xs">{unitsHint(row, t)}</p>
      </div>
    </div>
  );
}

function unitsHint(
  row: RoleUnitDraftRow,
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): string {
  if (row.unitKind === 'NOT_REQUIRED') {
    return t('roleUnits.notRequiredHint');
  }
  const units = emptyUnitsInputToNull(row.unitsInput);
  if (units === null) {
    return t('roleUnits.notConfigured');
  }
  if (isExplicitZeroUnits(units)) {
    return t('roleUnits.explicitZero');
  }
  return t('roleUnits.configured');
}
