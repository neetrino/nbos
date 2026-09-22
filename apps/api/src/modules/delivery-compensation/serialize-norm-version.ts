import {
  decimalToNullableString,
  type DeliveryBaseProfileFinancialDto,
  type DeliveryCompensationRoleKey,
  type DeliveryFunctionPriceFinancialDto,
  type DeliveryRoleRateFinancialDto,
  type DeliveryRoleUnitKind,
} from '@nbos/shared';

type DecimalLike = { toString(): string } | null;

type RoleUnitRecord = {
  roleKey: DeliveryCompensationRoleKey;
  unitKind: DeliveryRoleUnitKind;
  units: DecimalLike;
};

export type FunctionPriceRecord = {
  id: string;
  functionId: string;
  tierId: string | null;
  version: number;
  status: string;
  roleUnits: readonly RoleUnitRecord[];
};

export type BaseProfileRecord = {
  id: string;
  profileKey: string;
  version: number;
  productType: string | null;
  status: string;
  roleUnits: readonly RoleUnitRecord[];
  includedFunctions: readonly { functionId: string }[];
};

export type RoleRateRecord = {
  id: string;
  roleKey: DeliveryCompensationRoleKey;
  currency: string;
  rate: { toString(): string };
  version: number;
  status: string;
};

function serializeRoleUnits(rows: readonly RoleUnitRecord[]) {
  return rows.map((unit) => ({
    roleKey: unit.roleKey,
    unitKind: unit.unitKind,
    units: decimalToNullableString(unit.units),
  }));
}

export function serializeFunctionPrice(
  row: FunctionPriceRecord,
): DeliveryFunctionPriceFinancialDto {
  return {
    id: row.id,
    functionId: row.functionId,
    tierId: row.tierId,
    version: row.version,
    status: row.status,
    roleUnits: serializeRoleUnits(row.roleUnits),
  };
}

export function serializeBaseProfile(row: BaseProfileRecord): DeliveryBaseProfileFinancialDto {
  return {
    id: row.id,
    profileKey: row.profileKey,
    version: row.version,
    productType: row.productType,
    status: row.status,
    roleUnits: serializeRoleUnits(row.roleUnits),
    includedFunctionIds: row.includedFunctions.map((link) => link.functionId),
  };
}

export function serializeRoleRate(row: RoleRateRecord): DeliveryRoleRateFinancialDto {
  return {
    id: row.id,
    roleKey: row.roleKey,
    currency: row.currency,
    rate: row.rate.toString(),
    version: row.version,
    status: row.status,
  };
}
