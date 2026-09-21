import type { DeliveryFeatureOrigin } from '@nbos/shared';

export function resolveFeatureOrigin(
  functionId: string,
  includedFunctionIds: readonly string[],
): DeliveryFeatureOrigin {
  return includedFunctionIds.includes(functionId) ? 'INCLUDED' : 'EXTRA';
}
