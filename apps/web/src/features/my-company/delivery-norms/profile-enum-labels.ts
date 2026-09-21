import type { useTranslations } from 'next-intl';
import type { ProductCategoryKey, ProductTypeKey } from '@nbos/shared';
import { PRODUCT_CATEGORIES, PRODUCT_TYPES } from '@nbos/shared';

type DeliveryNormsT = ReturnType<typeof useTranslations<'hr.deliveryNorms'>>;

export function productTypeLabels(t: DeliveryNormsT): Record<ProductTypeKey, string> {
  return Object.fromEntries(
    PRODUCT_TYPES.map((key) => [key, t(`productTypes.${key}` as never)]),
  ) as Record<ProductTypeKey, string>;
}

export function productCategoryLabels(t: DeliveryNormsT): Record<ProductCategoryKey, string> {
  return Object.fromEntries(
    PRODUCT_CATEGORIES.map((key) => [key, t(`productCategories.${key}` as never)]),
  ) as Record<ProductCategoryKey, string>;
}
