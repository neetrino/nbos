'use client';

import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_ROLE_KEYS, type DeliveryRoleUnitFinancialDto } from '@nbos/shared';
import { cn } from '@/lib/utils';
import {
  ROLE_MESSAGE_KEYS,
  ROLE_UNITS_BREAKDOWN_CLASS,
  ROLE_UNITS_BREAKDOWN_ROW_CLASS,
} from './delivery-norms.constants';
import { formatRoleUnitDisplay, isConfiguredRoleUnit } from './summarize-role-units';

export function RoleUnitsBreakdown({ rows }: { rows: readonly DeliveryRoleUnitFinancialDto[] }) {
  const t = useTranslations('hr.deliveryNorms');
  const byKey = new Map(rows.map((row) => [row.roleKey, row]));
  return (
    <ul className={ROLE_UNITS_BREAKDOWN_CLASS}>
      {DELIVERY_COMPENSATION_ROLE_KEYS.map((roleKey) => {
        const row = byKey.get(roleKey);
        const configured = isConfiguredRoleUnit(row);
        return (
          <li key={roleKey} className={ROLE_UNITS_BREAKDOWN_ROW_CLASS}>
            <span className="text-muted-foreground truncate text-xs">
              {t(ROLE_MESSAGE_KEYS[roleKey])}
            </span>
            <span
              className={cn(
                'text-sm tabular-nums',
                configured ? 'text-foreground font-semibold' : 'text-muted-foreground',
              )}
            >
              {formatRoleUnitDisplay(row)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
