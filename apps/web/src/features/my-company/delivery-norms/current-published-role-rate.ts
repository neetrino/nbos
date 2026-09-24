import {
  DELIVERY_COMPENSATION_ROLE_KEYS,
  type DeliveryCompensationRoleKey,
  type DeliveryRoleRateFinancialDto,
} from '@nbos/shared';

export function currentRoleRate(
  rows: readonly DeliveryRoleRateFinancialDto[],
  roleKey: DeliveryCompensationRoleKey,
): string | null {
  const forRole = rows.filter((row) => row.roleKey === roleKey && row.status !== 'ARCHIVED');
  const published = highestVersion(forRole.filter((row) => row.status === 'PUBLISHED'));
  if (published) {
    return published.rate;
  }
  return highestVersion(forRole)?.rate ?? null;
}

export function currentRatesByRole(
  rows: readonly DeliveryRoleRateFinancialDto[],
): Record<DeliveryCompensationRoleKey, string | null> {
  const result = {} as Record<DeliveryCompensationRoleKey, string | null>;
  for (const roleKey of DELIVERY_COMPENSATION_ROLE_KEYS) {
    result[roleKey] = currentRoleRate(rows, roleKey);
  }
  return result;
}

function highestVersion(
  rows: readonly DeliveryRoleRateFinancialDto[],
): DeliveryRoleRateFinancialDto | null {
  let current: DeliveryRoleRateFinancialDto | null = null;
  for (const row of rows) {
    if (!current || row.version > current.version) {
      current = row;
    }
  }
  return current;
}
