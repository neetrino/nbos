import type { DeliveryCompensationRoleKey, DeliveryRoleUnitKind } from './constants';

export type DeliveryRoleUnitFinancialDto = {
  roleKey: DeliveryCompensationRoleKey;
  unitKind: DeliveryRoleUnitKind;
  /** Null remains null. Zero remains "0". Never coerce. */
  units: string | null;
};

export type DeliveryFunctionPriceFinancialDto = {
  id: string;
  functionId: string;
  version: number;
  status: string;
  roleUnits: DeliveryRoleUnitFinancialDto[];
};

export type DeliveryBaseProfileFinancialDto = {
  id: string;
  profileKey: string;
  version: number;
  status: string;
  roleUnits: DeliveryRoleUnitFinancialDto[];
  includedFunctionIds: string[];
};

export type DeliveryRoleRateFinancialDto = {
  id: string;
  roleKey: DeliveryCompensationRoleKey;
  currency: string;
  rate: string;
  version: number;
  status: string;
};

export function decimalToNullableString(value: { toString(): string } | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }
  return value.toString();
}
