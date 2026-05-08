import type {
  DeliveryResolutionEnum,
  DeliveryStageEnum,
  ExtensionSizeEnum,
  ProductCategoryEnum,
  ProductTypeEnum,
} from '@nbos/database';

export type ProductRuleFilter = {
  filterProductCategory: ProductCategoryEnum | null;
  filterProductType: ProductTypeEnum | null;
};

export type ExtensionRuleFilter = {
  filterExtensionSize: ExtensionSizeEnum | null;
};

export function productRuleMatchesFilter(
  rule: ProductRuleFilter,
  product: { productCategory: ProductCategoryEnum; productType: ProductTypeEnum },
): boolean {
  if (
    rule.filterProductCategory != null &&
    rule.filterProductCategory !== product.productCategory
  ) {
    return false;
  }
  if (rule.filterProductType != null && rule.filterProductType !== product.productType) {
    return false;
  }
  return true;
}

export function extensionRuleMatchesFilter(
  rule: ExtensionRuleFilter,
  extension: { size: ExtensionSizeEnum },
): boolean {
  if (rule.filterExtensionSize != null && rule.filterExtensionSize !== extension.size) {
    return false;
  }
  return true;
}

export function entityHasOpenDeliveryContext(entity: {
  deliveryStage: DeliveryStageEnum | null;
  deliveryResolution: DeliveryResolutionEnum | null;
}): entity is typeof entity & { deliveryStage: DeliveryStageEnum } {
  return entity.deliveryStage != null && entity.deliveryResolution == null;
}
