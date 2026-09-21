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
    'Ядро сайта-визитки на собственной разработке. Один вид — одно ядро; комплекты меняют только набор extra-модулей.',
  coreItems: [
    { label: 'Главная страница' },
    { label: 'Контакты' },
    { label: 'Адаптивность' },
    { label: 'Базовое SEO', note: 'Метаданные, sitemap, robots.' },
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
