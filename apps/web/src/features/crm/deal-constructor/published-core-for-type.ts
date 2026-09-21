import type { DeliveryBaseProfileFinancialDto } from '@nbos/shared';
import { sumFunctionRoleUnits } from '@/features/function-catalog/function-catalog-units';

export function profileUnitsTotal(row: DeliveryBaseProfileFinancialDto | null): number | undefined {
  if (!row) return undefined;
  return sumFunctionRoleUnits({
    functionId: row.id,
    version: row.version,
    status: row.status,
    roleUnits: row.roleUnits,
  });
}
