import { roleKindPaysUnits, type DeliveryRoleUnitFinancialDto } from '@nbos/shared';

export const ROLE_UNIT_EMPTY_DISPLAY = '—';

export function summarizeRoleUnits(rows: readonly DeliveryRoleUnitFinancialDto[]): string {
  return rows
    .map((row) => {
      if (!roleKindPaysUnits(row.unitKind)) {
        return `${row.roleKey}:${ROLE_UNIT_EMPTY_DISPLAY}`;
      }
      return `${row.roleKey}:${row.units ?? '∅'}`;
    })
    .join(' · ');
}

export function formatRoleUnitDisplay(row: DeliveryRoleUnitFinancialDto | undefined): string {
  if (!row || !roleKindPaysUnits(row.unitKind) || row.units === null) {
    return ROLE_UNIT_EMPTY_DISPLAY;
  }
  return row.units;
}

export function isConfiguredRoleUnit(row: DeliveryRoleUnitFinancialDto | undefined): boolean {
  return Boolean(row && roleKindPaysUnits(row.unitKind) && row.units !== null);
}
