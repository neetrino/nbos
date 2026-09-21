import { describe, expect, it } from 'vitest';
import { formatBaseProfileLabel, parseProfileKey } from './base-profile-label';

const LABELS = {
  productTypes: {
    BUSINESS_CARD_WEBSITE: 'Сайт-визитка',
    COMPANY_WEBSITE: 'Корпоративный сайт',
    MOBILE_APP: 'Мобильное приложение',
    WEB_APP: 'Веб-приложение',
    CRM: 'CRM',
    ECOMMERCE: 'Интернет-магазин',
    SAAS: 'SaaS',
    LANDING: 'Лендинг',
    ERP: 'ERP',
    LOGO: 'Логотип',
    BRANDING: 'Брендинг',
    DESIGN: 'Дизайн',
    SEO: 'SEO',
    PPC: 'PPC',
    SMM: 'SMM',
    OTHER: 'Другое',
  },
  sizes: {
    SMALL: 'Small',
    CLASSIC: 'Classic',
    LARGE: 'Large',
    VERY_LARGE: 'Very large',
    ENTERPRISE: 'Enterprise',
  },
} as const;

describe('parseProfileKey', () => {
  it('reads seeded company-site, shop and very-large keys', () => {
    expect(parseProfileKey('company-site-code-classic')).toEqual({
      productType: 'COMPANY_WEBSITE',
      productCategory: 'CODE',
      configSize: 'CLASSIC',
    });
    expect(parseProfileKey('shop-code-enterprise')).toEqual({
      productType: 'ECOMMERCE',
      productCategory: 'CODE',
      configSize: 'ENTERPRISE',
    });
    expect(parseProfileKey('crm-code-very-large')).toEqual({
      productType: 'CRM',
      productCategory: 'CODE',
      configSize: 'VERY_LARGE',
    });
  });

  it('accepts underscore keys without a category segment', () => {
    expect(parseProfileKey('ECOMMERCE_CLASSIC')).toEqual({
      productType: 'ECOMMERCE',
      productCategory: null,
      configSize: 'CLASSIC',
    });
  });
});

describe('formatBaseProfileLabel', () => {
  it('names a core as product, size and short version', () => {
    expect(formatBaseProfileLabel('company-site-code-classic', 1, LABELS)).toBe(
      'Корпоративный сайт · Classic · v1',
    );
    expect(formatBaseProfileLabel('landing-code-small', 2, LABELS)).toBe('Лендинг · Small · v2');
    expect(formatBaseProfileLabel('mobile-app-code-large', null, LABELS)).toBe(
      'Мобильное приложение · Large',
    );
  });

  it('keeps an unknown key and still shortens the version', () => {
    expect(formatBaseProfileLabel('custom-core', 3, LABELS)).toBe('custom-core · v3');
  });
});
