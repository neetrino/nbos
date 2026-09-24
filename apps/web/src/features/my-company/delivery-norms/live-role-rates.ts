import {
  DELIVERY_COMPENSATION_ROLE_KEYS,
  type DeliveryCompensationRoleKey,
  type DeliveryRoleRateFinancialDto,
} from '@nbos/shared';
import { liveNormPair, type LiveNormPair } from './live-norm-pair';

export type LiveRoleRate = LiveNormPair<DeliveryRoleRateFinancialDto> & {
  roleKey: DeliveryCompensationRoleKey;
};

export function liveRoleRates(rows: readonly DeliveryRoleRateFinancialDto[]): LiveRoleRate[] {
  return DELIVERY_COMPENSATION_ROLE_KEYS.map((roleKey) => ({
    roleKey,
    ...liveNormPair(
      roleKey,
      rows.filter((row) => row.roleKey === roleKey && row.status !== 'ARCHIVED'),
    ),
  }));
}

export function displayedRoleRate(pair: LiveRoleRate): string | null {
  return pair.published?.rate ?? pair.draft?.rate ?? null;
}
