import { BadRequestException } from '@nestjs/common';
import {
  credentialTypeForCategory,
  isCatalogCategory,
  type CatalogCredentialCategory,
} from '@nbos/shared';

export function requireCatalogCredentialPair(category: string | undefined): {
  category: CatalogCredentialCategory;
  credentialType: string;
} {
  if (!category) {
    throw new BadRequestException('Category is required');
  }
  if (!isCatalogCategory(category)) {
    throw new BadRequestException('Invalid category');
  }
  const credentialType = credentialTypeForCategory(category);
  if (!credentialType) {
    throw new BadRequestException('Invalid category');
  }
  return { category, credentialType };
}

/** Derive type from category only when the stored category actually changes. */
export function applyCatalogTypeOnCategoryChange<
  T extends { category?: string; credentialType?: string },
>(existingCategory: string, data: T): T {
  if (data.category === undefined || data.category === existingCategory) {
    const rest = { ...data };
    delete rest.credentialType;
    return rest;
  }
  const pair = requireCatalogCredentialPair(data.category);
  return { ...data, category: pair.category, credentialType: pair.credentialType };
}
