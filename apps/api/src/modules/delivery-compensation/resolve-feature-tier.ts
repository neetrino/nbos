import { throwDeliveryCompensationError } from './delivery-compensation-http-error';

export type FunctionTierRow = {
  id: string;
  position: number;
  productTypes: Array<{ productType: string }>;
};

/**
 * Decides which gradation of a function is being sold. The client may name one explicitly, but it can
 * only name a gradation of this very function; otherwise the gradation follows the product type, so a
 * larger volume cannot be obtained by editing a request. A function without gradations resolves to no
 * gradation at all, which keeps every existing card working unchanged.
 *
 * Two gradations mapped to the same product type is a catalog mistake, not a choice to make silently:
 * one of them would pay more for the same work, so the selection stops and asks for an explicit answer.
 */
export function resolveFeatureTierId(input: {
  tiers: readonly FunctionTierRow[];
  productType: string | null;
  requestedTierId?: string | null;
}): string | null {
  if (input.tiers.length === 0) {
    if (input.requestedTierId) {
      throwDeliveryCompensationError('FUNCTION_TIER_UNKNOWN');
    }
    return null;
  }
  if (input.requestedTierId) {
    const requested = input.tiers.find((tier) => tier.id === input.requestedTierId);
    if (!requested) {
      throwDeliveryCompensationError('FUNCTION_TIER_UNKNOWN');
    }
    return requested.id;
  }
  const matching =
    input.productType === null ? [] : tiersForProductType(input.tiers, input.productType);
  if (matching.length !== 1) {
    throwDeliveryCompensationError('FUNCTION_TIER_REQUIRED');
  }
  return matching[0]?.id ?? null;
}

function tiersForProductType(
  tiers: readonly FunctionTierRow[],
  productType: string,
): FunctionTierRow[] {
  return tiers
    .filter((tier) => tier.productTypes.some((row) => row.productType === productType))
    .sort((left, right) => left.position - right.position);
}
