import { DELIVERY_CONFIG_SIZES, type DeliveryConfigSize } from '@nbos/shared';
import type { SizePresetDto } from '@/lib/api/delivery-catalog-structure';

export function firstDeliveryConfigSize(): DeliveryConfigSize {
  for (const size of DELIVERY_CONFIG_SIZES) {
    return size;
  }
  throw new Error('DELIVERY_CONFIG_SIZES must not be empty');
}

export function uniqueProfileKeys(rows: readonly { profileKey: string }[]): string[] {
  const keys: string[] = [];
  for (const row of rows) {
    if (!keys.includes(row.profileKey)) {
      keys.push(row.profileKey);
    }
  }
  return keys;
}

export function togglePresetFunctionId(ids: readonly string[], id: string): string[] {
  if (ids.includes(id)) {
    return ids.filter((item) => item !== id);
  }
  return [...ids, id];
}

export function functionIdsForSize(
  presets: readonly SizePresetDto[],
  configSize: DeliveryConfigSize,
): string[] {
  return presets.find((row) => row.configSize === configSize)?.functionIds ?? [];
}

export function sizePresetMap(
  presets: readonly SizePresetDto[],
): Record<DeliveryConfigSize, string[]> {
  const mapped = emptySizePresetMap();
  for (const row of presets) {
    if (!isConfigSize(row.configSize)) {
      continue;
    }
    mapped[row.configSize] = row.functionIds;
  }
  return mapped;
}

export function replaceSizePresetInList(
  presets: readonly SizePresetDto[],
  next: SizePresetDto,
): SizePresetDto[] {
  const without = presets.filter(
    (row) => !(row.profileKey === next.profileKey && row.configSize === next.configSize),
  );
  return [...without, next];
}

function emptySizePresetMap(): Record<DeliveryConfigSize, string[]> {
  const mapped = {} as Record<DeliveryConfigSize, string[]>;
  for (const size of DELIVERY_CONFIG_SIZES) {
    mapped[size] = [];
  }
  return mapped;
}

function isConfigSize(value: string): value is DeliveryConfigSize {
  return (DELIVERY_CONFIG_SIZES as readonly string[]).includes(value);
}
