import { isHiddenFromNewProductTypePick, type DeliveryBaseProfileFinancialDto } from '@nbos/shared';
import {
  formatBaseProfileLabel,
  parseProfileKey,
  type BaseProfileLabelDictionaries,
} from './base-profile-label';

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
    if (isHiddenFromNewProductTypePick(parseProfileKey(row.profileKey).productType)) continue;
    const kindId = kindIdForProfile(row);
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
      title: titleForKind(kindId, kindRows, labels),
      productType: parseProfileKey(kindRows[0]?.profileKey ?? kindId).productType,
      rows: kindRows,
    };
  });
}

function kindIdForProfile(row: DeliveryBaseProfileFinancialDto): string {
  return parseProfileKey(row.profileKey).productType ?? row.profileKey;
}

function titleForKind(
  kindId: string,
  rows: readonly DeliveryBaseProfileFinancialDto[],
  labels: BaseProfileLabelDictionaries,
): string {
  const sample = rows[0]?.profileKey ?? kindId;
  const parsed = parseProfileKey(sample);
  if (parsed.productType) {
    return labels.productTypes[parsed.productType];
  }
  return formatBaseProfileLabel(sample, null, labels);
}
