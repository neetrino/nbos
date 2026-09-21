import type { DeliveryRoleUnitFinancialDto } from '@nbos/shared';

export const ROLE_UNIT_EMPTY_DISPLAY = '—';

export function summarizeRoleUnits(rows: readonly DeliveryRoleUnitFinancialDto[]): string {
  return rows
    .map((row) => {
      if (row.unitKind === 'NOT_REQUIRED') {
        return `${row.roleKey}:${ROLE_UNIT_EMPTY_DISPLAY}`;
      }
      return `${row.roleKey}:${row.units ?? '∅'}`;
    })
    .join(' · ');
}

export function formatRoleUnitDisplay(row: DeliveryRoleUnitFinancialDto | undefined): string {
  if (!row || row.unitKind === 'NOT_REQUIRED' || row.units === null) {
    return ROLE_UNIT_EMPTY_DISPLAY;
  }
  return row.units;
}

export function isConfiguredRoleUnit(row: DeliveryRoleUnitFinancialDto | undefined): boolean {
  return Boolean(row && row.unitKind === 'REQUIRED' && row.units !== null);
}
