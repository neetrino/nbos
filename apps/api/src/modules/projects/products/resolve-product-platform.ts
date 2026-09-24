import { BadRequestException } from '@nestjs/common';
import {
  coerceOptionalProductPlatform,
  isProductPlatform,
  productPlatformApplies,
  productTypePlatformPairError,
  type ProductPlatform,
} from '@nbos/shared';

function assertRequestedPlatform(value: string | null | undefined): void {
  if (value == null || value === '') return;
  if (!isProductPlatform(value)) {
    throw new BadRequestException('productPlatform must be WEB, APP or DESKTOP');
  }
}

export function resolveProductPlatform(input: {
  productCategory?: string | null;
  productType?: string | null;
  requested?: string | null;
}): ProductPlatform | null {
  assertRequestedPlatform(input.requested);
  return coerceOptionalProductPlatform(input);
}

export function resolveDealProductPlatform(input: {
  productCategory?: string | null;
  productType?: string | null;
  requested?: string | null;
}): ProductPlatform | null {
  return resolveProductPlatform(input);
}

export function assertProductTypePlatformPair(
  input: {
    productCategory?: string | null;
    productType?: string | null;
    productPlatform?: string | null;
  },
  options: {
    allowLegacyHiddenType?: boolean;
    allowLegacyMobileApp?: boolean;
    currentProductType?: string | null;
    requirePlatform?: boolean;
  } = {},
): void {
  if (
    options.requirePlatform &&
    productPlatformApplies(input.productCategory) &&
    !input.productPlatform
  ) {
    throw new BadRequestException('Product platform is required');
  }
  const message = productTypePlatformPairError(input, {
    allowLegacyHiddenType: options.allowLegacyHiddenType ?? options.allowLegacyMobileApp,
    currentProductType: options.currentProductType,
  });
  if (message) throw new BadRequestException(message);
}
