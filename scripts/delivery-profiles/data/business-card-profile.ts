import type { ProfileSeedKind } from './profile-seed-types';

const BASE = ['SRV_DOMAIN_HOSTING_SETUP', 'SRV_ACCEPTANCE_SUPPORT', 'INT_WEB_ANALYTICS'] as const;

const EXTENDED = [
  ...BASE,
  'CNT_MULTILINGUAL',
  'CNT_FORMS_BUILDER',
  'MSG_EMAIL_NOTIFICATIONS',
  'SRV_SEO_TECH_SETUP',
] as const;

const FULL = [
  ...EXTENDED,
  'CNT_BLOG',
  'CNT_PAGE_BUILDER',
  'INT_ADS_PIXELS',
  'CRM_LEAD_CAPTURE',
  'CNT_MEDIA_GALLERY',
] as const;

/**
 * Ядро визитки. Админки и блога в нём нет — как у лендинга, это отдельные модули.
 * Состав меньше сайта компании: главная, контакты, адаптив и базовое SEO.
 */
export const BUSINESS_CARD_PROFILE: ProfileSeedKind = {
  keyStem: 'business-card-code',
  productType: 'BUSINESS_CARD_WEBSITE',
  productCategory: 'CODE',
  description:
    'Custom-built business-card site core. One kind is one core; kits only change the extra-module set.',
  coreItems: [
    { label: 'Home page' },
    { label: 'Contacts' },
    { label: 'Responsive layout' },
    { label: 'Basic SEO', note: 'Metadata, sitemap, robots.' },
  ],
  units: {
    BACKEND: 8,
    FRONTEND: 16,
    PM: 5,
    DESIGNER: 12,
    QA: 3,
    TECHNICAL_SPECIALIST: 2,
  },
  includedFunctionCodes: [],
  presets: {
    BASE,
    EXTENDED,
    FULL,
  },
};
