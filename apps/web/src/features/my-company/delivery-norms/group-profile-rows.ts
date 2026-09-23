import {
  isProductTypeOfferedForNewProduct,
  type DeliveryBaseProfileFinancialDto,
} from '@nbos/shared';
import { parseProfileKey, type BaseProfileLabelDictionaries } from './base-profile-label';
import { liveNormPair } from './live-norm-pair';

export type ProfileKindGroup = {
  kindId: string;
  title: string;
  productType: string | null;
  rows: DeliveryBaseProfileFinancialDto[];
};

export function groupProfileRows(
  rows: readonly DeliveryBaseProfileFinancialDto[],
  labels: BaseProfileLabelDictionaries,
): ProfileKindGroup[] {
  const order: string[] = [];
  const grouped = new Map<string, DeliveryBaseProfileFinancialDto[]>();
  for (const row of rows) {
    const productType = productTypeOf(row);
    if (!productType || !isProductTypeOfferedForNewProduct(productType)) continue;
    const kindId = productType;
    const list = grouped.get(kindId);
    if (!list) {
      grouped.set(kindId, [row]);
      order.push(kindId);
      continue;
    }
    list.push(row);
  }
  return order.map((kindId) => {
    const kindRows = grouped.get(kindId) ?? [];
    return {
      kindId,
      title: titleForKind(kindId, labels),
      productType: kindId,
      rows: kindRows,
    };
  });
}

/** Draft wins. Otherwise the published core. An archived-only kind stays visible and read-only. */
export function liveProfileRow(
  group: ProfileKindGroup | null,
): DeliveryBaseProfileFinancialDto | null {
  if (!group) return null;
  const pair = liveNormPair(group.kindId, group.rows);
  return pair.draft ?? pair.published ?? group.rows[0] ?? null;
}

function productTypeOf(row: DeliveryBaseProfileFinancialDto): string | null {
  return row.productType ?? parseProfileKey(row.profileKey).productType;
}

function titleForKind(productType: string, labels: BaseProfileLabelDictionaries): string {
  if (productType in labels.productTypes) {
    return labels.productTypes[productType as keyof typeof labels.productTypes];
  }
  return productType;
}
