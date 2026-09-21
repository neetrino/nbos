import { useMemo, useState } from 'react';
import type { DeliveryBaseProfileFinancialDto } from '@nbos/shared';
import type { BaseProfileLabelDictionaries } from './base-profile-label';
import { groupProfileRows } from './group-profile-rows';
import { itemsMatchingSearch } from './matches-norm-search';

export function useProfileKindSelection(
  rows: readonly DeliveryBaseProfileFinancialDto[],
  dictionaries: BaseProfileLabelDictionaries,
) {
  const groups = useMemo(() => groupProfileRows(rows, dictionaries), [dictionaries, rows]);
  const [query, setQuery] = useState('');
  const [kindId, setKindId] = useState<string | null>(groups[0]?.kindId ?? null);
  const visibleGroups = useMemo(
    () => itemsMatchingSearch(groups, query, (group) => [group.title, group.kindId]),
    [groups, query],
  );
  const resolvedKindId =
    kindId !== null && groups.some((group) => group.kindId === kindId)
      ? kindId
      : (groups[0]?.kindId ?? null);
  const selectedGroup = groups.find((group) => group.kindId === resolvedKindId) ?? null;
  const selectedRow = selectedGroup?.rows[0] ?? null;

  return {
    groups,
    visibleGroups,
    query,
    setQuery,
    resolvedKindId,
    setKindId,
    selectedGroup,
    selectedRow,
  };
}
