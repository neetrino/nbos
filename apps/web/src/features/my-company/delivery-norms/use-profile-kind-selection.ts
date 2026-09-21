import { useMemo, useState } from 'react';
import type { DeliveryBaseProfileFinancialDto, DeliveryConfigSize } from '@nbos/shared';
import type { BaseProfileLabelDictionaries } from './base-profile-label';
import {
  groupProfileRows,
  profileRowMatchingSize,
  resolveSelectedSize,
} from './group-profile-rows';
import { itemsMatchingSearch } from './matches-norm-search';
import { firstDeliveryConfigSize } from './size-preset-draft';

const FIRST_CONFIG_SIZE = firstDeliveryConfigSize();

export function useProfileKindSelection(
  rows: readonly DeliveryBaseProfileFinancialDto[],
  dictionaries: BaseProfileLabelDictionaries,
) {
  const groups = useMemo(() => groupProfileRows(rows, dictionaries), [dictionaries, rows]);
  const [query, setQuery] = useState('');
  const [kindId, setKindId] = useState<string | null>(groups[0]?.kindId ?? null);
  const [selectedSize, setSelectedSize] = useState<DeliveryConfigSize>(FIRST_CONFIG_SIZE);
  const visibleGroups = useMemo(
    () => itemsMatchingSearch(groups, query, (group) => [group.title, group.kindId]),
    [groups, query],
  );
  const resolvedKindId =
    kindId !== null && groups.some((group) => group.kindId === kindId)
      ? kindId
      : (groups[0]?.kindId ?? null);
  const selectedGroup = groups.find((group) => group.kindId === resolvedKindId) ?? null;
  const resolvedSize = resolveSelectedSize(selectedGroup, selectedSize);
  const selectedRow = selectedGroup ? profileRowMatchingSize(selectedGroup, resolvedSize) : null;

  return {
    groups,
    visibleGroups,
    query,
    setQuery,
    resolvedKindId,
    setKindId,
    resolvedSize,
    setSelectedSize,
    selectedGroup,
    selectedRow,
  };
}
