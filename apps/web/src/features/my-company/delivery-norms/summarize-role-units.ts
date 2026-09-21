import type { DeliveryRoleUnitFinancialDto } from '@nbos/shared';

export function summarizeRoleUnits(rows: readonly DeliveryRoleUnitFinancialDto[]): string {
  return rows
    .map((row) => {
      if (row.unitKind === 'NOT_REQUIRED') {
        return `${row.roleKey}:—`;
      }
      return `${row.roleKey}:${row.units ?? '∅'}`;
    })
    .join(' · ');
}
