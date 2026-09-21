import type { useTranslations } from 'next-intl';
import type { ProductCategoryKey, ProductTypeKey } from '@nbos/shared';

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
