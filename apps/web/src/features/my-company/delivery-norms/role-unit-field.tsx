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
import { cn } from '@/lib/utils';
import {
  ROLE_KIND_TONE_CLASS,
  ROLE_KIND_TRIGGER_CLASS,
  ROLE_MESSAGE_KEYS,
  ROLE_UNITS_INPUT_CLASS,
  ROLE_UNIT_AMOUNT_CLASS,
  ROLE_UNIT_DIVIDER_CLASS,
  ROLE_UNIT_ROW_CLASS,
} from './delivery-norms.constants';
import type { RoleUnitDraftRow } from './role-units-draft';

const KIND_LABEL_KEYS = {
  REQUIRED: 'roleUnits.needed',
  OPTIONAL: 'roleUnits.ifPresent',
  NOT_REQUIRED: 'roleUnits.unused',
} as const;

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
  const roleName = t(ROLE_MESSAGE_KEYS[row.roleKey]);

  return (
    <div className={cn(ROLE_UNIT_ROW_CLASS, disabled && 'pointer-events-none opacity-60')}>
      <div className={ROLE_UNIT_AMOUNT_CLASS}>
        <RoleUnitsInput
          row={row}
          label={roleName}
          disabled={disabled || unused}
          onChange={onChange}
        />
      </div>
      <span className={ROLE_UNIT_DIVIDER_CLASS} aria-hidden />
      <p className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">{roleName}</p>
      <span className={ROLE_UNIT_DIVIDER_CLASS} aria-hidden />
      <RoleKindSelect
        value={row.unitKind}
        disabled={disabled}
        label={t('roleUnits.kindAria')}
        labels={kindLabels(t)}
        onChange={(unitKind) => onChange({ unitKind })}
      />
    </div>
  );
}

function RoleUnitsInput({
  row,
  label,
  disabled,
  onChange,
}: {
  row: RoleUnitDraftRow;
  label: string;
  disabled?: boolean;
  onChange: (patch: Partial<Omit<RoleUnitDraftRow, 'roleKey'>>) => void;
}) {
  const unused = row.unitKind === 'NOT_REQUIRED';
  return (
    <input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      aria-label={label}
      value={unused ? '' : row.unitsInput}
      placeholder="—"
      className={ROLE_UNITS_INPUT_CLASS}
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
      <SelectTrigger
        size="sm"
        aria-label={label}
        className={cn(ROLE_KIND_TRIGGER_CLASS, ROLE_KIND_TONE_CLASS[value])}
      >
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
