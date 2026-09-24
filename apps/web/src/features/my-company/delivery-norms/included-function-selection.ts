import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import type { SearchOption } from '@/components/shared';
import { catalogFunctionSearchParts } from './group-catalog-functions';

export function catalogFunctionOption(item: DeliveryFunctionOperationalDto): SearchOption {
  return {
    value: item.id,
    label: item.title,
    subtitle: catalogFunctionSearchParts(item)
      .filter((part) => part.trim() !== '')
      .slice(1)
      .join(' · '),
  };
}

export function addableIncludedOptions(
  options: readonly DeliveryFunctionOperationalDto[],
  selectedIds: readonly string[],
): SearchOption[] {
  const selected = new Set(selectedIds);
  return options.filter((item) => !selected.has(item.id)).map(catalogFunctionOption);
}

export function selectedIncludedFunctions(
  options: readonly DeliveryFunctionOperationalDto[],
  selectedIds: readonly string[],
): DeliveryFunctionOperationalDto[] {
  const byId = new Map(options.map((item) => [item.id, item]));
  return selectedIds.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}

export function addIncludedFunctionId(selectedIds: readonly string[], id: string): string[] {
  if (id.trim() === '' || selectedIds.includes(id)) {
    return [...selectedIds];
  }
  return [...selectedIds, id];
}

export function removeIncludedFunctionId(selectedIds: readonly string[], id: string): string[] {
  return selectedIds.filter((selected) => selected !== id);
}
