import type { useTranslations } from 'next-intl';
import type {
  DeliveryDesignMode,
  DeliveryImplementationBase,
  ProductCategoryKey,
  ProductTypeKey,
} from '@nbos/shared';

type DeliveryNormsT = ReturnType<typeof useTranslations<'hr.deliveryNorms'>>;

export function productTypeLabels(t: DeliveryNormsT): Record<ProductTypeKey, string> {
  return {
    BUSINESS_CARD_WEBSITE: t('productTypes.BUSINESS_CARD_WEBSITE'),
    COMPANY_WEBSITE: t('productTypes.COMPANY_WEBSITE'),
    MOBILE_APP: t('productTypes.MOBILE_APP'),
    WEB_APP: t('productTypes.WEB_APP'),
    CRM: t('productTypes.CRM'),
    ECOMMERCE: t('productTypes.ECOMMERCE'),
    SAAS: t('productTypes.SAAS'),
    LANDING: t('productTypes.LANDING'),
    ERP: t('productTypes.ERP'),
    LOGO: t('productTypes.LOGO'),
    BRANDING: t('productTypes.BRANDING'),
    DESIGN: t('productTypes.DESIGN'),
    SEO: t('productTypes.SEO'),
    PPC: t('productTypes.PPC'),
    SMM: t('productTypes.SMM'),
    OTHER: t('productTypes.OTHER'),
  };
}

export function productCategoryLabels(t: DeliveryNormsT): Record<ProductCategoryKey, string> {
  return {
    CODE: t('productCategories.CODE'),
    WORDPRESS: t('productCategories.WORDPRESS'),
    SHOPIFY: t('productCategories.SHOPIFY'),
    MARKETING: t('productCategories.MARKETING'),
    OTHER: t('productCategories.OTHER'),
  };
}

export function implementationBaseLabels(
  t: DeliveryNormsT,
): Record<DeliveryImplementationBase, string> {
  return {
    FROM_SCRATCH: t('implementationBases.FROM_SCRATCH'),
    EXISTING_BASE: t('implementationBases.EXISTING_BASE'),
    WHITE_LABEL: t('implementationBases.WHITE_LABEL'),
  };
}

export function designModeLabels(t: DeliveryNormsT): Record<DeliveryDesignMode, string> {
  return {
    AI_DESIGN: t('designModes.AI_DESIGN'),
    CONCEPT: t('designModes.CONCEPT'),
    FULL_DESIGN: t('designModes.FULL_DESIGN'),
  };
}
