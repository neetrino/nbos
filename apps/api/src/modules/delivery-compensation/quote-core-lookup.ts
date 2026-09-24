import { BadRequestException } from '@nestjs/common';
import { PRODUCT_CATEGORIES, PRODUCT_TYPES } from '@nbos/shared';

export type DealQuotePreview = {
  productType: string;
  productCategory: string | null;
};

export type QuoteCoreAxes = {
  productType: string | null;
  productCategory: string | null;
  hideSavedExtras: boolean;
};

/**
 * The deal form previews a type before Save. Core matching follows that selection.
 * Extras saved for the previous type stay in the database until Save resets them.
 */
export function parseDealQuotePreview(query: {
  productType?: string;
  productCategory?: string;
}): DealQuotePreview | null {
  const productType = blankToNull(query.productType);
  const productCategory = blankToNull(query.productCategory);
  if (!productType && !productCategory) return null;
  if (!isListed(productType, PRODUCT_TYPES)) {
    throw new BadRequestException('Unknown product type.');
  }
  if (productCategory && !isListed(productCategory, PRODUCT_CATEGORIES)) {
    throw new BadRequestException('Unknown product category.');
  }
  return { productType, productCategory };
}

export function quoteAxesForPreview(
  saved: { productType: string | null; productCategory: string | null },
  preview: DealQuotePreview | null,
): QuoteCoreAxes {
  if (!preview) return { ...saved, hideSavedExtras: false };
  return {
    productType: preview.productType,
    productCategory: preview.productCategory,
    hideSavedExtras:
      preview.productType !== saved.productType ||
      preview.productCategory !== saved.productCategory,
  };
}

function blankToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

function isListed(value: string | null, allowed: readonly string[]): value is string {
  return value !== null && allowed.includes(value);
}
