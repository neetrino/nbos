'use client';

import { useTranslations } from 'next-intl';
import { DELIVERY_ROLE_UNIT_KINDS, type DeliveryRoleUnitKind } from '@nbos/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';
import {
  ROLE_KIND_SHELL_CLASS,
  ROLE_MESSAGE_KEYS,
  ROLE_UNITS_INPUT_SHELL_CLASS,
  ROLE_UNIT_ROW_CLASS,
} from './delivery-norms.constants';
import type { RoleUnitDraftRow } from './role-units-draft';

const KIND_LABEL_KEYS = {
  REQUIRED: 'roleUnits.needed',
  OPTIONAL: 'roleUnits.ifPresent',
  NOT_REQUIRED: 'roleUnits.unused',
} as const;

const KIND_TRIGGER_CLASS = [
  'h-8 w-full border-0 bg-transparent px-2 shadow-none',
  'hover:bg-transparent data-[size=sm]:h-8 data-[size=sm]:min-h-8',
].join(' ');

export function RoleUnitField({
  row,
  disabled,
  onChange,
}: {
  row: RoleUnitDraftRow;
  disabled?: boolean;
  onChange: (patch: Partial<Omit<RoleUnitDraftRow, 'roleKey'>>) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const unused = row.unitKind === 'NOT_REQUIRED';
  return (
    <div
      className={cn(
        DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>{t(ROLE_MESSAGE_KEYS[row.roleKey])}</span>
      <div className={ROLE_UNIT_ROW_CLASS}>
        <div className={cn(DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS, ROLE_UNITS_INPUT_SHELL_CLASS)}>
          <RoleUnitsInput row={row} disabled={disabled || unused} onChange={onChange} />
        </div>
        <div className={ROLE_KIND_SHELL_CLASS}>
          <RoleKindSelect
            value={row.unitKind}
            disabled={disabled}
            label={t('roleUnits.kindAria')}
            labels={kindLabels(t)}
            onChange={(unitKind) => onChange({ unitKind })}
          />
        </div>
      </div>
    </div>
  );
}

function RoleUnitsInput({
  row,
  disabled,
  onChange,
}: {
  row: RoleUnitDraftRow;
  disabled?: boolean;
  onChange: (patch: Partial<Omit<RoleUnitDraftRow, 'roleKey'>>) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const unused = row.unitKind === 'NOT_REQUIRED';
  return (
    <input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      value={unused ? '' : row.unitsInput}
      placeholder={t('roleUnits.placeholder')}
      className={cn(
        DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS,
        'min-w-0 text-center text-sm tabular-nums',
      )}
      onChange={(event) => onChange({ unitsInput: event.target.value })}
    />
  );
}

function kindLabels(
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): Record<DeliveryRoleUnitKind, string> {
  return {
    REQUIRED: t(KIND_LABEL_KEYS.REQUIRED),
    OPTIONAL: t(KIND_LABEL_KEYS.OPTIONAL),
    NOT_REQUIRED: t(KIND_LABEL_KEYS.NOT_REQUIRED),
  };
}

function RoleKindSelect({
  value,
  disabled,
  label,
  labels,
  onChange,
}: {
  value: DeliveryRoleUnitKind;
  disabled?: boolean;
  label: string;
  labels: Record<DeliveryRoleUnitKind, string>;
  onChange: (value: DeliveryRoleUnitKind) => void;
}) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (!next || !(DELIVERY_ROLE_UNIT_KINDS as readonly string[]).includes(next)) return;
        onChange(next as DeliveryRoleUnitKind);
      }}
    >
      <SelectTrigger size="sm" aria-label={label} className={KIND_TRIGGER_CLASS}>
        <SelectValue>{() => labels[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {DELIVERY_ROLE_UNIT_KINDS.map((option) => (
          <SelectItem key={option} value={option}>
            {labels[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
