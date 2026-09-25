'use client';

import { useTranslations } from 'next-intl';
import { DELIVERY_ROLE_UNIT_KINDS, type DeliveryRoleUnitKind } from '@nbos/shared';
import { cn } from '@/lib/utils';
import {
  ROLE_MESSAGE_KEYS,
  ROLE_UNITS_INPUT_CLASS,
  ROLE_UNIT_CARD_CLASS,
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
    <div className={cn(ROLE_UNIT_CARD_CLASS, disabled && 'pointer-events-none opacity-60')}>
      <p className="text-muted-foreground mb-2 truncate text-center text-xs font-medium">
        {roleName}
      </p>
      <div className="flex items-center gap-2">
        <RoleUnitsInput
          row={row}
          label={roleName}
          disabled={disabled || unused}
          onChange={onChange}
        />
        <RoleKindSwitch
          value={row.unitKind}
          label={t('roleUnits.kindAria')}
          labels={kindLabels(t)}
          onChange={(unitKind) => onChange({ unitKind })}
        />
      </div>
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

function RoleKindSwitch({
  value,
  label,
  labels,
  onChange,
}: {
  value: DeliveryRoleUnitKind;
  label: string;
  labels: Record<DeliveryRoleUnitKind, string>;
  onChange: (value: DeliveryRoleUnitKind) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex min-w-0 flex-1 flex-col gap-1">
      {DELIVERY_ROLE_UNIT_KINDS.map((kind) => (
        <button
          key={kind}
          type="button"
          aria-pressed={kind === value}
          className={cn(
            'rounded-md px-2 py-1 text-xs font-medium',
            kind === value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted',
          )}
          onClick={() => onChange(kind)}
        >
          {labels[kind]}
        </button>
      ))}
    </div>
  );
}
