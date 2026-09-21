'use client';

import { useTranslations } from 'next-intl';
import { isExplicitZeroUnits } from '@nbos/shared';
import { InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import {
  NORMS_SHEET_ROLE_BLOCK_CLASS,
  ROLE_MESSAGE_KEYS,
  ROLE_UNITS_BREAKDOWN_CLASS,
} from './delivery-norms.constants';
import { NormsSheetSection } from './norms-sheet-section';
import {
  emptyUnitsInputToNull,
  replaceRoleUnitDraft,
  type RoleUnitDraftRow,
} from './role-units-draft';
import { selectOptionsFromRecord, applySelectValue } from './select-options-from-record';

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
    <NormsSheetSection title={t('roleUnits.title')}>
      <fieldset className="contents" disabled={disabled}>
        <p className="text-muted-foreground text-xs">{t('roleUnits.hint')}</p>
        <div className={ROLE_UNITS_BREAKDOWN_CLASS}>
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
    </NormsSheetSection>
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
    <div className={NORMS_SHEET_ROLE_BLOCK_CLASS}>
      <p className="text-foreground text-sm font-medium">{t(ROLE_MESSAGE_KEYS[row.roleKey])}</p>
      <InlineField
        variant="controlled"
        type="select"
        className={FORM_FIELD_CELL_CLASS}
        label={t('roleUnits.required')}
        value={row.unitKind}
        disabled={disabled}
        options={selectOptionsFromRecord(UNIT_KIND_OPTIONS, {
          REQUIRED: t('roleUnits.required'),
          NOT_REQUIRED: t('roleUnits.notRequired'),
        })}
        onValueChange={(value) =>
          applySelectValue(UNIT_KIND_OPTIONS, value, (unitKind) => onChange({ unitKind }))
        }
      />
      <InlineField
        variant="controlled"
        className={FORM_FIELD_CELL_CLASS}
        label={t('roleUnits.unitsLabel')}
        value={row.unitsInput}
        disabled={disabled || notRequired}
        placeholder={t('roleUnits.placeholder')}
        onValueChange={(unitsInput) => onChange({ unitsInput })}
      />
      <p className="text-muted-foreground text-xs">{unitsHint(row, t)}</p>
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
