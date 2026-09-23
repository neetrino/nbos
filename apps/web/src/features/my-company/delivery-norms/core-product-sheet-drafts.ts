import { useState } from 'react';
import type { DeliveryBaseProfileFinancialDto } from '@nbos/shared';
import type { LiveNormPair } from './live-norm-pair';
import {
  createEmptyRoleUnitDrafts,
  roleUnitDraftsFromDto,
  type RoleUnitDraftRow,
} from './role-units-draft';

export function liveCoreSource(
  pair: LiveNormPair<DeliveryBaseProfileFinancialDto> | null,
): DeliveryBaseProfileFinancialDto | null {
  return pair?.draft ?? pair?.published ?? null;
}

export function useCoreProductDrafts(source: DeliveryBaseProfileFinancialDto | null) {
  const [roleUnits, setRoleUnits] = useState<RoleUnitDraftRow[]>(() =>
    source ? roleUnitDraftsFromDto(source.roleUnits) : createEmptyRoleUnitDrafts(),
  );
  const [includedFunctionIds, setIncludedFunctionIds] = useState(source?.includedFunctionIds ?? []);
  const [seenId, setSeenId] = useState(source?.id ?? null);
  if ((source?.id ?? null) !== seenId) {
    setSeenId(source?.id ?? null);
    setRoleUnits(source ? roleUnitDraftsFromDto(source.roleUnits) : createEmptyRoleUnitDrafts());
    setIncludedFunctionIds(source?.includedFunctionIds ?? []);
  }
  const unitsBaseline = source
    ? roleUnitDraftsFromDto(source.roleUnits)
    : createEmptyRoleUnitDrafts();
  const includedBaseline = source?.includedFunctionIds ?? [];
  return {
    roleUnits,
    includedFunctionIds,
    unitsDirty: JSON.stringify(roleUnits) !== JSON.stringify(unitsBaseline),
    includedDirty: [...includedFunctionIds].sort().join() !== [...includedBaseline].sort().join(),
    setRoleUnits,
    setIncludedFunctionIds,
    resetUnits: () => setRoleUnits(unitsBaseline),
    resetIncluded: () => setIncludedFunctionIds(includedBaseline),
  };
}
