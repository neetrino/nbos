import { describe, expect, it } from 'vitest';
import { PRODUCT_TYPES, type ProductTypeKey } from '@nbos/shared';
import { formatBaseProfileLabel, parseProfileKey } from './base-profile-label';

const LABELS = {
  productTypes: {
    ...Object.fromEntries(PRODUCT_TYPES.map((key) => [key, key])),
    BUSINESS_CARD_WEBSITE: 'Сайт-визитка',
    COMPANY_WEBSITE: 'Корпоративный сайт',
    MOBILE_APP: 'Мобильное приложение',
    LANDING: 'Лендинг',
    SAAS: 'SaaS',
  } as Record<ProductTypeKey, string>,
};

describe('parseProfileKey', () => {
  it('reads seeded company-site and shop keys without a size segment', () => {
    expect(parseProfileKey('company-site-code')).toEqual({
      productType: 'COMPANY_WEBSITE',
      productCategory: 'CODE',
    });
    expect(parseProfileKey('shop-code')).toEqual({
      productType: 'ECOMMERCE',
      productCategory: 'CODE',
    });
    expect(parseProfileKey('crm-code')).toEqual({
      productType: 'CRM',
      productCategory: 'CODE',
    });
    expect(parseProfileKey('business-card-code')).toEqual({
      productType: 'BUSINESS_CARD_WEBSITE',
      productCategory: 'CODE',
    });
    expect(parseProfileKey('web-app-code')).toEqual({
      productType: 'WEB_APP',
      productCategory: 'CODE',
    });
    expect(parseProfileKey('erp-code')).toEqual({
      productType: 'ERP',
      productCategory: 'CODE',
    });
    expect(parseProfileKey('saas-code')).toEqual({
      productType: 'SAAS',
      productCategory: 'CODE',
    });
    expect(parseProfileKey('lms-code')).toEqual({
      productType: 'LMS',
      productCategory: 'CODE',
    });
    expect(parseProfileKey('bos-code')).toEqual({
      productType: 'BOS',
      productCategory: 'CODE',
    });
  });

  it('accepts underscore keys without a category segment', () => {
    expect(parseProfileKey('ECOMMERCE')).toEqual({
      productType: 'ECOMMERCE',
      productCategory: null,
    });
  });
});

describe('formatBaseProfileLabel', () => {
  it('names a core as product type and short version', () => {
    expect(formatBaseProfileLabel('company-site-code', 1, LABELS)).toBe('Корпоративный сайт · v1');
    expect(formatBaseProfileLabel('landing-code', 2, LABELS)).toBe('Лендинг · v2');
    expect(formatBaseProfileLabel('mobile-app-code', null, LABELS)).toBe('Мобильное приложение');
    expect(formatBaseProfileLabel('business-card-code', 1, LABELS)).toBe('Сайт-визитка · v1');
    expect(formatBaseProfileLabel('saas-code', 1, LABELS)).toBe('SaaS · v1');
  });

  it('keeps an unknown key and still shortens the version', () => {
    expect(formatBaseProfileLabel('custom-core', 3, LABELS)).toBe('custom-core · v3');
  });
});
