import { parseBaseProfileWriteBody } from '@nbos/shared';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { dateInputToIso, todayDateInputValue } from './effective-from';
import { messageFromCaught } from './message-from-caught';
import { buildCompleteRoleUnitVector, type RoleUnitDraftRow } from './role-units-draft';

export async function saveCoreUnit(input: {
  productType: string;
  draftId: string | null;
  roleUnits: RoleUnitDraftRow[];
  includedFunctionIds: string[];
  canSave: boolean;
  invalidUnits: string;
  fallback: string;
  onError: (message: string) => void;
  onSaved: () => void;
}): Promise<void> {
  if (!input.canSave) return;
  const roleUnits = buildCompleteRoleUnitVector(input.roleUnits);
  if (roleUnits === null) {
    input.onError(input.invalidUnits);
    return;
  }
  try {
    await persistCoreUnit(input.productType, input.draftId, roleUnits, input.includedFunctionIds);
    input.onSaved();
  } catch (caught) {
    input.onError(messageFromCaught(caught, input.fallback));
  }
}

async function persistCoreUnit(
  productType: string,
  draftId: string | null,
  roleUnits: NonNullable<ReturnType<typeof buildCompleteRoleUnitVector>>,
  includedFunctionIds: string[],
): Promise<void> {
  if (draftId) {
    await deliveryNormsApi.updateBaseProfileDraft(draftId, { roleUnits, includedFunctionIds });
    return;
  }
  await deliveryNormsApi.createBaseProfile(
    parseBaseProfileWriteBody({
      productType,
      effectiveFrom: dateInputToIso(todayDateInputValue()),
      roleUnits,
      includedFunctionIds,
    }),
  );
}
