'use client';

import { useTranslations } from 'next-intl';
import { DELIVERY_ROLE_UNIT_KINDS, type DeliveryRoleUnitKind } from '@nbos/shared';
import { SegmentedTabs } from '@/components/shared';
import {
  DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';
import { ROLE_MESSAGE_KEYS } from './delivery-norms.constants';
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
  return (
    <div
      className={cn(
        DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>{t(ROLE_MESSAGE_KEYS[row.roleKey])}</span>
      <div className={cn(DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS, 'gap-2 overflow-visible pr-1.5')}>
        <input
          type="text"
          inputMode="decimal"
          disabled={disabled || unused}
          value={unused ? '' : row.unitsInput}
          placeholder={t('roleUnits.placeholder')}
          className={cn(
            DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS,
            'min-w-0 truncate text-sm tabular-nums',
          )}
          onChange={(event) => onChange({ unitsInput: event.target.value })}
        />
        <SegmentedTabs
          value={row.unitKind}
          options={DELIVERY_ROLE_UNIT_KINDS.map((value) => ({
            value,
            label: t(KIND_LABEL_KEYS[value]),
          }))}
          ariaLabel={t('roleUnits.kindAria')}
          className="mb-1 self-end"
          listClassName="h-7 shrink-0 rounded-full bg-background p-0.5"
          pillClassName="rounded-full"
          buttonClassName="h-6 min-w-[2.5rem] rounded-full px-2.5 py-0 text-xs font-medium leading-none"
          onChange={(unitKind: DeliveryRoleUnitKind) => onChange({ unitKind })}
        />
      </div>
    </div>
  );
}
