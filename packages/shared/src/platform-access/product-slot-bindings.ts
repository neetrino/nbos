import {
  PRODUCT_SLOT_FIELD_MAP,
  type ProductSlotFieldName,
  type ProductTeamSlot,
} from './constants';

export interface ProductSlotSourceRow {
  pmId?: string | null;
  developerId?: string | null;
  designerId?: string | null;
  technicalSpecialistId?: string | null;
  qaLeadId?: string | null;
}

export interface ProductSlotBinding {
  slot: ProductTeamSlot;
  employeeId: string;
  field: ProductSlotFieldName;
}

/** Derives primary slot assignments from legacy product FK columns. */
export function productSlotBindingsFromRow(row: ProductSlotSourceRow): ProductSlotBinding[] {
  const bindings: ProductSlotBinding[] = [];
  for (const field of Object.keys(PRODUCT_SLOT_FIELD_MAP) as ProductSlotFieldName[]) {
    const employeeId = row[field];
    if (!employeeId) continue;
    bindings.push({
      field,
      slot: PRODUCT_SLOT_FIELD_MAP[field],
      employeeId,
    });
  }
  return bindings;
}
