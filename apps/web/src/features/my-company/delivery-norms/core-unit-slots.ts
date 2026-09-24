import type { DeliveryBaseProfileFinancialDto } from '@nbos/shared';

export type CoreUnitSlot = {
  productType: string;
  rows: DeliveryBaseProfileFinancialDto[];
};

/** One slot per kind a new product can select. Archived rows do not fill the card. */
export function coreUnitSlots(
  offeredTypes: readonly string[],
  rows: readonly DeliveryBaseProfileFinancialDto[],
): CoreUnitSlot[] {
  return offeredTypes.map((productType) => ({
    productType,
    rows: rows
      .filter((row) => row.productType === productType && row.status !== 'ARCHIVED')
      .sort(byNewerVersion),
  }));
}

function byNewerVersion(
  left: DeliveryBaseProfileFinancialDto,
  right: DeliveryBaseProfileFinancialDto,
): number {
  return right.version - left.version;
}
