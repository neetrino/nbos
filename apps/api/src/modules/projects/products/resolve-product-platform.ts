import { BadRequestException } from '@nestjs/common';
import {
  coerceOptionalProductPlatform,
  isProductPlatform,
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
