import type { ProfileSeedKind } from './profile-seed-types';

const BASE = [
  'SRV_DOMAIN_HOSTING_SETUP',
  'SRV_ACCEPTANCE_SUPPORT',
  'INT_WEB_ANALYTICS',
  'CNT_MULTILINGUAL',
  'INT_ADS_PIXELS',
  'MSG_EMAIL_NOTIFICATIONS',
  'SRV_SEO_TECH_SETUP',
] as const;

const EXTENDED = [
  ...BASE,
  'CRM_LEAD_CAPTURE',
  'CNT_VIDEO_HOSTING',
  'CNT_FORMS_BUILDER',
  'CNT_BANNERS_PROMO',
  'MSG_SMS_NOTIFICATIONS',
] as const;

const FULL = [
  ...EXTENDED,
  'PAY_AMERIABANK',
  'CNT_PAGE_BUILDER',
  'INT_EXTERNAL_CRM',
  'ANL_FUNNEL_ANALYSIS',
  'AI_CONTENT_GENERATION',
  'PLT_CUSTOM_DOMAINS',
  'PLT_PERFORMANCE_HARDENING',
  'PLT_ACCESSIBILITY_PASS',
  'PLT_MONITORING_ALERTS',
  'MSG_WHATSAPP_NOTIFICATIONS',
] as const;

/**
 * Ядро лендинга. Админки, личного кабинета и мультиязычности в нём нет — это отдельные модули,
 * решение владельца. Поэтому лендинг с мультиязычностью считается как ядро плюс модуль, а не как
 * «другой лендинг».
 *
 * Аналитики в ядре нет намеренно: карточка `INT_WEB_ANALYTICS` начинается с установки счётчика,
 * поэтому строка про подключение аналитики означала бы двойную оплату той же работы.
 */
export const LANDING_PROFILE: ProfileSeedKind = {
  keyStem: 'landing-code',
  productType: 'LANDING',
  productCategory: 'CODE',
  description:
    'Custom-built landing page core. One kind is one core; kits only change the extra-module set.',
  coreItems: [
    { label: 'Single page with sections' },
    { label: 'Lead form' },
    { label: 'Responsive layout' },
    { label: 'Basic SEO', note: 'Metadata, sitemap, robots.' },
  ],
  units: {
    BACKEND: 5,
    FRONTEND: 14,
    PM: 4,
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
