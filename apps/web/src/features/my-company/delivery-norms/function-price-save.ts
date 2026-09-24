import { parseFunctionPriceWriteBody, type DeliveryFunctionOperationalDto } from '@nbos/shared';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { dateInputToIso, todayDateInputValue } from './effective-from';
import { resolveFunctionPriceWriteTarget } from './function-price-draft';
import { pairForSelection } from './function-unit-focus';
import type { LiveFunctionPrice } from './live-function-prices';
import { messageFromCaught } from './message-from-caught';
import { buildCompleteRoleUnitVector, type RoleUnitDraftRow } from './role-units-draft';

export async function saveFunctionPrice(input: {
  catalog: readonly DeliveryFunctionOperationalDto[];
  item: DeliveryFunctionOperationalDto | undefined;
  focusFunctionId: string;
  focused: LiveFunctionPrice[];
  tierId: string;
  roleUnits: RoleUnitDraftRow[];
  fallback: string;
  invalidUnits: string;
  missingFunction: string;
  missingTier: string;
  onError: (message: string) => void;
  onSaved: () => void;
}): Promise<void> {
  const roleUnits = buildCompleteRoleUnitVector(input.roleUnits);
  if (roleUnits === null) {
    input.onError(input.invalidUnits);
    return;
  }
  const target = resolveFunctionPriceWriteTarget({
    catalog: input.catalog,
    functionId: input.focusFunctionId,
    tierId: input.tierId,
  });
  if (!target.ok) {
    input.onError(target.error === 'function' ? input.missingFunction : input.missingTier);
    return;
  }
  try {
    await persistFunctionPrice(input.item, input.focused, input.tierId, target, roleUnits);
    input.onSaved();
  } catch (caught) {
    input.onError(messageFromCaught(caught, input.fallback));
  }
}

async function persistFunctionPrice(
  item: DeliveryFunctionOperationalDto | undefined,
  pairs: LiveFunctionPrice[],
  selection: string,
  target: { functionId: string; tierId: string | null },
  roleUnits: NonNullable<ReturnType<typeof buildCompleteRoleUnitVector>>,
): Promise<void> {
  const existing = pairForSelection(item, pairs, selection);
  if (existing?.draft) {
    await deliveryNormsApi.updateFunctionPriceDraft(existing.draft.id, { roleUnits });
    return;
  }
  await deliveryNormsApi.createFunctionPrice(
    parseFunctionPriceWriteBody({
      functionId: target.functionId,
      tierId: target.tierId,
      effectiveFrom: dateInputToIso(todayDateInputValue()),
      roleUnits,
    }),
  );
}
