import {
  DELIVERY_CONFIG_SIZES,
  type DeliveryBaseProfileFinancialDto,
  type DeliveryConfigSize,
} from '@nbos/shared';
import {
  formatBaseProfileLabel,
  parseProfileKey,
  type BaseProfileLabelDictionaries,
} from './base-profile-label';

export type ProfileKindGroup = {
  kindId: string;
  title: string;
  rows: DeliveryBaseProfileFinancialDto[];
};

export function groupProfileRows(
  rows: readonly DeliveryBaseProfileFinancialDto[],
  labels: BaseProfileLabelDictionaries,
): ProfileKindGroup[] {
  const order: string[] = [];
  const grouped = new Map<string, DeliveryBaseProfileFinancialDto[]>();
  for (const row of rows) {
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
      rows: kindRows,
    };
  });
}

export function profileRowMatchingSize(
  group: ProfileKindGroup,
  size: DeliveryConfigSize,
): DeliveryBaseProfileFinancialDto | null {
  const sized = group.rows.find((row) => parseProfileKey(row.profileKey).configSize === size);
  if (sized) {
    return sized;
  }
  const unsized = group.rows.filter((row) => parseProfileKey(row.profileKey).configSize === null);
  return unsized.length === 1 ? (unsized[0] ?? null) : null;
}

export function sizesForKindGroup(group: ProfileKindGroup): DeliveryConfigSize[] {
  const present = new Set(
    group.rows.flatMap((row) => {
      const size = parseProfileKey(row.profileKey).configSize;
      return size ? [size] : [];
    }),
  );
  if (present.size === 0) {
    return [...DELIVERY_CONFIG_SIZES];
  }
  return DELIVERY_CONFIG_SIZES.filter((size) => present.has(size));
}

export function resolveSelectedSize(
  group: ProfileKindGroup | null,
  size: DeliveryConfigSize,
): DeliveryConfigSize {
  if (!group || profileRowMatchingSize(group, size)) {
    return size;
  }
  return (
    DELIVERY_CONFIG_SIZES.find((candidate) => profileRowMatchingSize(group, candidate) !== null) ??
    size
  );
}

export function availableSizesForGroup(group: ProfileKindGroup): Set<DeliveryConfigSize> {
  return new Set(
    DELIVERY_CONFIG_SIZES.filter((size) => profileRowMatchingSize(group, size) !== null),
  );
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
